import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq, ilike, inArray, lt, sql } from "drizzle-orm";

import { formatBytes, STORAGE_CONFIG } from "@/config/storage.config";
import { envData } from "@/env";
import type { User } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizationStorageLimits, uploads } from "@/lib/db/schema";
import { logError, logInfo, logWarning } from "@/lib/logger";
import { r2 } from "@/lib/r2";
/* ---------------------------------- Types --------------------------------- */

export interface PresignParams {
	fileName: string;
	contentType: string;
	visibility: "public" | "private";
	size?: number;
}

export interface PresignResult {
	uploadId: string;
	url: string;
	key: string;
	publicUrl: string | null;
}

export interface StorageUsageInfo {
	currentUsage: number;
	storageLimit: number;
	usagePercent: number;
	availableSpace: number;
}

/* -------------------------------- Constants ------------------------------- */

// Import constants from centralized config
const {
	PRESIGN_EXPIRES_SECONDS,
	PENDING_EXPIRES_MS,
	CLEANUP_BATCH_SIZE,
	DEFAULT_STORAGE_LIMIT,
	MAX_FILE_SIZE,
	ALLOWED_CONTENT_TYPES,
} = STORAGE_CONFIG;

function validateFileSize(size: number | undefined): number {
	if (!size) {
		throw new Error("File size is required");
	}
	if (size <= 0) {
		throw new Error("File size must be positive");
	}
	if (size > MAX_FILE_SIZE) {
		throw new Error(
			`File size exceeds maximum allowed size of ${formatBytes(MAX_FILE_SIZE)}`,
		);
	}
	return size;
}

function validateContentType(contentType: string): void {
	if (
		!ALLOWED_CONTENT_TYPES.includes(
			contentType as (typeof ALLOWED_CONTENT_TYPES)[number],
		)
	) {
		throw new Error(
			`Content type '${contentType}' is not allowed. Allowed types: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
		);
	}
}

function sanitizeFileName(fileName: string): string {
	// Remove path traversal attempts and only allow alphanumeric, dots, dashes, underscores
	const baseName = fileName.split("/").pop()?.split("\\").pop() || "file";
	const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
	// Limit length to prevent issues
	return sanitized.slice(0, 200);
}

/* --------------------------- Presign Upload URL ---------------------------- */

export async function presignUpload(
	{
		fileName,
		contentType,
		visibility,
		size,
		folderId,
	}: PresignParams & { folderId?: string | null },
	user: User,
	tenantId: string,
	organizationId?: string,
): Promise<PresignResult> {
	try {
		const validatedSize = validateFileSize(size);
		validateContentType(contentType);

		// Check quota before creating upload record
		if (organizationId && size) {
			await checkStorageQuota(organizationId, size);
		}

		const safeName = sanitizeFileName(fileName);
		const uniqueId = crypto.randomUUID();
		const key = `${tenantId}/${visibility}/uploads/${uniqueId}-${safeName}`;

		const [upload] = await db
			.insert(uploads)
			.values({
				fileKey: key,
				bucket: envData.CF_BUCKET_NAME || "",
				contentType,
				size: validatedSize,
				status: "pending",
				userId: user.id,
				organizationId,
				folderId: folderId || null,
				expiresAt: new Date(Date.now() + PENDING_EXPIRES_MS),
			})
			.returning();

		const url = await getSignedUrl(
			r2,
			new PutObjectCommand({
				Bucket: envData.CF_BUCKET_NAME || "",
				Key: key,
				ContentType: contentType,
				CacheControl:
					visibility === "public"
						? "public, max-age=31536000, immutable"
						: undefined,
			}),
			{ expiresIn: PRESIGN_EXPIRES_SECONDS },
		);

		const publicUrl =
			visibility === "public"
				? `${envData.CDN_BASE_URL?.replace(/\/$/, "")}/${key}`
				: null;

		logInfo("presignUpload", "Upload presigned successfully", {
			uploadId: upload.id,
			userId: user.id,
			organizationId,
			size,
			contentType,
		});

		return {
			uploadId: upload.id,
			url,
			key,
			publicUrl,
		};
	} catch (error) {
		logError("presignUpload", error, { fileName, contentType, size });
		throw error;
	}
}

/* -------------------------- Storage Quota Check --------------------------- */

async function checkStorageQuota(
	organizationId: string,
	additionalSize: number,
): Promise<void> {
	const limits = await db.query.organizationStorageLimits.findFirst({
		where: eq(organizationStorageLimits.organizationId, organizationId),
	});

	const currentUsage = limits?.currentUsage || 0;
	const storageLimit = limits?.storageLimit || DEFAULT_STORAGE_LIMIT;
	const projected = currentUsage + additionalSize;

	if (projected > storageLimit) {
		const usedMB = (currentUsage / 1024 / 1024).toFixed(2);
		const limitMB = (storageLimit / 1024 / 1024).toFixed(2);
		const neededMB = (additionalSize / 1024 / 1024).toFixed(2);

		throw new Error(
			`Storage limit exceeded. Current: ${usedMB}MB, Limit: ${limitMB}MB, Requested: ${neededMB}MB`,
		);
	}
}

function extractFileKeys(fileKeys: string[]) {
	return fileKeys.map((input) => {
		// Check if it's a URL (contains protocol)
		if (input.startsWith("http://") || input.startsWith("https://")) {
			try {
				const url = new URL(input);
				// Remove the leading slash from pathname
				return url.pathname.substring(1);
			} catch {
				// If URL parsing fails, return as is
				return input;
			}
		}

		// Already just a path, return as is
		return input;
	});
}

/* ------------------------------- Commit Uploads ---------------------------- */

export async function commitUploadsByFileKeys(inputKeys: string[]) {
	const fileKeys = extractFileKeys(inputKeys);

	logInfo("commitUploadsByFileKeys", "Processing file keys", {
		inputCount: inputKeys.length,
		extractedCount: fileKeys.length,
	});

	try {
		const result = await db.transaction(async (tx) => {
			const committed = await tx
				.update(uploads)
				.set({
					status: "committed",
					updatedAt: new Date(),
				})
				.where(
					and(
						inArray(uploads.fileKey, fileKeys),
						eq(uploads.status, "pending"),
					),
				)
				.returning();

			if (!committed.length) {
				throw new Error("No pending uploads found for provided keys");
			}

			// Since all uploads are always for one organization, calculate total size
			let totalSize = 0;
			let organizationId: string | null = null;
			let fileCount = 0;

			for (const upload of committed) {
				if (upload.size) {
					totalSize += upload.size;
					fileCount++;
				}
				// Get organizationId from first upload (all are same org)
				if (!organizationId && upload.organizationId) {
					organizationId = upload.organizationId;
				}
			}

			// Update quota only if there's an organization and size to add
			if (organizationId && totalSize > 0) {
				// Get or create the limit record
				const existingLimit =
					await tx.query.organizationStorageLimits.findFirst({
						where: eq(organizationStorageLimits.organizationId, organizationId),
					});

				if (existingLimit) {
					// Check if update would exceed limit (race condition protection)
					const newUsage = (existingLimit.currentUsage || 0) + totalSize;
					if (newUsage > existingLimit.storageLimit) {
						const usedMB = (existingLimit.currentUsage / 1024 / 1024).toFixed(
							2,
						);
						const limitMB = (existingLimit.storageLimit / 1024 / 1024).toFixed(
							2,
						);
						const attemptedMB = (totalSize / 1024 / 1024).toFixed(2);

						throw new Error(
							`Storage limit exceeded for organization ${organizationId}. Current: ${usedMB}MB, Limit: ${limitMB}MB, Attempted: ${attemptedMB}MB`,
						);
					}

					// Update with constraint check - only update if within limit
					const updated = await tx
						.update(organizationStorageLimits)
						.set({
							currentUsage: sql`${organizationStorageLimits.currentUsage} + ${totalSize}`,
							updatedAt: new Date(),
						})
						.where(
							and(
								eq(organizationStorageLimits.organizationId, organizationId),
								// Ensure we don't exceed limit even with race conditions
								sql`${organizationStorageLimits.currentUsage} + ${totalSize} <= ${organizationStorageLimits.storageLimit}`,
							),
						)
						.returning();

					if (!updated.length) {
						throw new Error(
							`Failed to update storage quota - limit would be exceeded for organization ${organizationId}`,
						);
					}

					logInfo("commitUploads", "Quota updated", {
						organizationId,
						filesCommitted: fileCount,
						sizeAdded: totalSize,
						newUsage: (existingLimit.currentUsage || 0) + totalSize,
					});
				} else {
					// Create new limit record
					if (totalSize > DEFAULT_STORAGE_LIMIT) {
						throw new Error(
							`Initial upload exceeds default storage limit for organization ${organizationId}`,
						);
					}

					await tx.insert(organizationStorageLimits).values({
						organizationId,
						currentUsage: totalSize,
						storageLimit: DEFAULT_STORAGE_LIMIT,
					});

					logInfo("commitUploads", "New quota record created", {
						organizationId,
						initialUsage: totalSize,
						storageLimit: DEFAULT_STORAGE_LIMIT,
					});
				}
			}

			return committed;
		});

		logInfo("commitUploadsByFileKeys", "Uploads committed successfully", {
			count: result.length,
			fileKeysCount: fileKeys.length,
		});

		return { data: result, error: null };
	} catch (error) {
		logError("commitUploadsByFileKeys", error, {
			fileKeys,
			fileKeysCount: fileKeys.length,
		});

		// Specific error message for quota issues
		if (
			error instanceof Error &&
			error.message.includes("Storage limit exceeded")
		) {
			return { error: error.message, data: null };
		}

		return {
			error: "Failed to commit uploads. Please try again.",
			data: null,
		};
	}
}

/* ----------------------------- Delete Upload ------------------------------- */

export async function deleteUploadedFile(
	key: string,
	user: { id: string },
	activeOrgId?: string,
) {
	try {
		const upload = await db.query.uploads.findFirst({
			where: eq(uploads.fileKey, key),
		});

		if (!upload) {
			return { error: "Upload not found", data: null };
		}

		// Authorization check - verify resource ownership
		const isOrgAuthorized =
			upload.organizationId && upload.organizationId === activeOrgId;
		const isUserAuthorized =
			!upload.organizationId && upload.userId === user.id;

		if (!isOrgAuthorized && !isUserAuthorized) {
			logWarning("deleteUploadedFile", "Unauthorized deletion attempt", {
				key,
				userId: user.id,
				uploadUserId: upload.userId,
				uploadOrgId: upload.organizationId,
				activeOrgId,
			});
			return { error: "Forbidden", data: null };
		}

		// Use transaction for atomicity
		await db.transaction(async (tx) => {
			// Delete from R2 first - if this fails, transaction rolls back
			await r2.send(
				new DeleteObjectCommand({
					Bucket: envData.CF_BUCKET_NAME,
					Key: key,
				}),
			);

			// Mark as deleted in database
			await tx
				.update(uploads)
				.set({
					status: "deleted",
					deletedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(uploads.id, upload.id));

			// Update storage quota if applicable
			if (upload.organizationId && upload.size) {
				const updated = await tx
					.update(organizationStorageLimits)
					.set({
						currentUsage: sql`GREATEST(0, ${organizationStorageLimits.currentUsage} - ${upload.size})`,
						updatedAt: new Date(),
					})
					.where(
						eq(organizationStorageLimits.organizationId, upload.organizationId),
					)
					.returning();

				if (updated.length) {
					logInfo("deleteUploadedFile", "Quota decremented", {
						organizationId: upload.organizationId,
						sizeFreed: upload.size,
						newUsage: updated[0].currentUsage,
					});
				}
			}
		});

		logInfo("deleteUploadedFile", "File deleted successfully", {
			key,
			uploadId: upload.id,
			size: upload.size,
			organizationId: upload.organizationId,
		});

		return { data: { success: true }, error: null };
	} catch (error) {
		logError("deleteUploadedFile", error, { key });

		// Check if it's an R2 error
		if (error && typeof error === "object" && "name" in error) {
			// biome-ignore lint/suspicious/noExplicitAny: <>
			if ((error as any).name === "NoSuchKey") {
				// File doesn't exist in R2, but we should still mark as deleted in DB
				logWarning("deleteUploadedFile", "File not found in R2", { key });
			}
		}

		return { error: "Failed to delete file", data: null };
	}
}

/* --------------------------- Move Upload -------------------------------- */

export async function moveUploadedFile(
	key: string,
	folderId: string | null,
	user: { id: string },
	activeOrgId?: string,
) {
	try {
		const upload = await db.query.uploads.findFirst({
			where: eq(uploads.fileKey, key),
		});

		if (!upload) {
			return { error: "Upload not found", data: null };
		}

		// Authorization check - verify resource ownership
		const isOrgAuthorized =
			upload.organizationId && upload.organizationId === activeOrgId;
		const isUserAuthorized =
			!upload.organizationId && upload.userId === user.id;

		if (!isOrgAuthorized && !isUserAuthorized) {
			logWarning("moveUploadedFile", "Unauthorized move attempt", {
				key,
				userId: user.id,
				uploadUserId: upload.userId,
				activeOrgId,
			});
			return { error: "Forbidden", data: null };
		}

		// Verify destination folder exists and belongs to correct org
		if (folderId) {
			const folder = await db.query.storageFolders.findFirst({
				where: eq(storageFolders.id, folderId),
			});

			if (!folder) {
				return { error: "Destination folder not found", data: null };
			}

			if (
				folder.organizationId !== activeOrgId &&
				!(!folder.organizationId && !activeOrgId)
			) {
				return {
					error: "Destination folder belongs to another organization",
					data: null,
				};
			}
		}

		// Update folder
		const [updated] = await db
			.update(uploads)
			.set({
				folderId,
				updatedAt: new Date(),
			})
			.where(eq(uploads.id, upload.id))
			.returning();

		logInfo("moveUploadedFile", "File moved successfully", {
			key,
			fromFolder: upload.folderId,
			toFolder: folderId,
		});

		return { data: updated, error: null };
	} catch (error) {
		logError("moveUploadedFile", error, { key, folderId });
		return { error: "Failed to move file", data: null };
	}
}

/* -------------------------- Cleanup Orphan Uploads -------------------------- */

export async function cleanupOrphanFiles() {
	try {
		const expiredAt = new Date(Date.now() - PENDING_EXPIRES_MS);

		const expired = await db
			.select()
			.from(uploads)
			.where(
				and(eq(uploads.status, "pending"), lt(uploads.expiresAt, expiredAt)),
			)
			.limit(CLEANUP_BATCH_SIZE);

		if (!expired.length) {
			logInfo("cleanupOrphanFiles", "No expired uploads to clean");
			return { deletedCount: 0, failedCount: 0 };
		}

		let deletedCount = 0;
		let failedCount = 0;
		const failedKeys: string[] = [];

		// Process deletions with proper error handling
		for (const upload of expired) {
			try {
				// Use transaction to ensure both R2 and DB are updated together
				await db.transaction(async (tx) => {
					// Delete from R2
					await r2.send(
						new DeleteObjectCommand({
							Bucket: envData.CF_BUCKET_NAME,
							Key: upload.fileKey,
						}),
					);

					// Only delete from DB if R2 deletion succeeded
					await tx.delete(uploads).where(eq(uploads.id, upload.id));
				});

				deletedCount++;
			} catch (err) {
				failedCount++;
				failedKeys.push(upload.fileKey);

				logError("cleanupOrphanFiles", err, {
					uploadId: upload.id,
					fileKey: upload.fileKey,
				});

				// Mark as failed for manual review (outside transaction)
				try {
					await db
						.update(uploads)
						.set({
							status: "cleanup_failed",
							updatedAt: new Date(),
						})
						.where(eq(uploads.id, upload.id));
				} catch (updateErr) {
					logError("cleanupOrphanFiles", updateErr, {
						uploadId: upload.id,
						action: "marking_as_failed",
					});
				}
			}
		}

		logInfo("cleanupOrphanFiles", "Cleanup completed", {
			deletedCount,
			failedCount,
			totalProcessed: expired.length,
			failedKeys: failedKeys.length > 0 ? failedKeys : undefined,
		});

		return { deletedCount, failedCount, failedKeys };
	} catch (error) {
		logError("cleanupOrphanFiles", error);
		throw error;
	}
}

/* -------------------------- Batch Operations ------------------------------ */

/**
 * Delete multiple uploads in batch (useful for entity deletion)
 */
export async function batchDeleteUploads(
	fileKeys: string[],
	user: { id: string },
	activeOrgId?: string,
) {
	const results = {
		deleted: 0,
		failed: 0,
		errors: [] as string[],
	};

	// Process in parallel with concurrency limit
	const CONCURRENCY = 5;
	const chunks: string[][] = [];

	for (let i = 0; i < fileKeys.length; i += CONCURRENCY) {
		chunks.push(fileKeys.slice(i, i + CONCURRENCY));
	}

	for (const chunk of chunks) {
		const promises = chunk.map((key) =>
			deleteUploadedFile(key, user, activeOrgId)
				.then((result) => ({ key, result }))
				.catch((error) => ({
					key,
					result: { error: error.message, data: null },
				})),
		);

		const chunkResults = await Promise.all(promises);

		for (const { key, result } of chunkResults) {
			if (result.error) {
				results.failed++;
				results.errors.push(`${key}: ${result.error}`);
			} else {
				results.deleted++;
			}
		}
	}

	logInfo("batchDeleteUploads", "Batch deletion completed", {
		total: fileKeys.length,
		deleted: results.deleted,
		failed: results.failed,
	});

	return results;
}

/**
 * Get storage usage for an organization
 */
export async function getStorageUsage(
	organizationId: string,
): Promise<StorageUsageInfo> {
	const limits = await db.query.organizationStorageLimits.findFirst({
		where: eq(organizationStorageLimits.organizationId, organizationId),
	});

	const currentUsage = Math.max(0, limits?.currentUsage || 0);
	const storageLimit = limits?.storageLimit || DEFAULT_STORAGE_LIMIT;
	const usagePercent = (currentUsage / storageLimit) * 100;
	const availableSpace = Math.max(0, storageLimit - currentUsage);

	return {
		currentUsage,
		storageLimit,
		usagePercent: Math.round(usagePercent * 100) / 100,
		availableSpace,
	};
}

/**
 * List uploads for a user or organization
 */
export async function listUploads(
	user: User,
	options: {
		organizationId?: string;
		status?: "pending" | "committed" | "deleted";
		limit?: number;
		offset?: number;
		search?: string;
		folderId?: string | null;
	} = {},
) {
	const {
		organizationId,
		status,
		limit = 50,
		offset = 0,
		search,
		folderId,
	} = options;

	const conditions = [];

	if (organizationId) {
		conditions.push(eq(uploads.organizationId, organizationId));
	} else {
		conditions.push(eq(uploads.userId, user.id));
	}

	if (status) {
		conditions.push(eq(uploads.status, status));
	}

	if (search) {
		// Basic search on fileKey - this will find files where path contains the search term
		conditions.push(ilike(uploads.fileKey, `%${search}%`));
	}

	if (folderId !== undefined) {
		if (folderId === null) {
			conditions.push(isNull(uploads.folderId));
		} else {
			conditions.push(eq(uploads.folderId, folderId));
		}
	}

	const results = await db
		.select()
		.from(uploads)
		.where(and(...conditions))
		.limit(limit)
		.offset(offset)
		.orderBy(sql`${uploads.createdAt} DESC`);

	return results.map((upload) => ({
		...upload,
		publicUrl: `${envData.CDN_BASE_URL?.replace(/\/$/, "")}/${upload.fileKey}`,
	}));
}

/* -------------------------- Folder Management ----------------------------- */

import { isNull } from "drizzle-orm";
import { storageFolders } from "@/lib/db/schema";

export interface CreateFolderParams {
	name: string;
	parentId?: string;
	organizationId?: string;
}

export async function createFolder(params: CreateFolderParams, user: User) {
	const { name, parentId, organizationId } = params;

	// Basic validation
	if (!name || name.trim().length === 0) {
		throw new Error("Folder name is required");
	}

	// Verify parent folder exists and belongs to organization if provided
	if (parentId) {
		const parent = await db.query.storageFolders.findFirst({
			where: eq(storageFolders.id, parentId),
		});

		if (!parent) {
			throw new Error("Parent folder not found");
		}

		if (parent.organizationId !== organizationId) {
			throw new Error("Parent folder belongs to a different organization");
		}
	}

	const [folder] = await db
		.insert(storageFolders)
		.values({
			name: name.trim(),
			parentId: parentId || null,
			organizationId,
			createdBy: user.id,
			updatedBy: user.id,
		})
		.returning();

	return folder;
}

export async function listFolders(
	organizationId: string | undefined,
	parentId?: string | null,
) {
	const conditions = [];

	if (organizationId) {
		conditions.push(eq(storageFolders.organizationId, organizationId));
	}

	if (parentId) {
		conditions.push(eq(storageFolders.parentId, parentId));
	} else {
		conditions.push(isNull(storageFolders.parentId));
	}

	conditions.push(isNull(storageFolders.deletedAt));

	return db
		.select()
		.from(storageFolders)
		.where(and(...conditions))
		.orderBy(storageFolders.name);
}

export async function deleteFolder(folderId: string, organizationId?: string) {
	// Check if folder exists
	const folder = await db.query.storageFolders.findFirst({
		where: eq(storageFolders.id, folderId),
	});

	if (!folder) {
		throw new Error("Folder not found");
	}

	if (folder.organizationId !== organizationId) {
		throw new Error("Unauthorized access to folder");
	}

	// Use transaction to delete folder and contents recursively (soft delete)
	// For now, simpler implementation: verify folder is empty of subfolders and files
	// Or just soft delete the folder. The usage query assumes folder structure.

	// Check for subfolders
	const subfolders = await db.query.storageFolders.findFirst({
		where: and(
			eq(storageFolders.parentId, folderId),
			isNull(storageFolders.deletedAt),
		),
	});

	if (subfolders) {
		throw new Error("Folder is not empty (contains subfolders)");
	}

	// Check for files
	const files = await db.query.uploads.findFirst({
		where: and(eq(uploads.folderId, folderId), ne(uploads.status, "deleted")),
	});

	if (files) {
		throw new Error("Folder is not empty (contains files)");
	}

	// Soft delete
	await db
		.update(storageFolders)
		.set({
			deletedAt: new Date(),
		})
		.where(eq(storageFolders.id, folderId));

	return { success: true };
}

import { ne } from "drizzle-orm";
