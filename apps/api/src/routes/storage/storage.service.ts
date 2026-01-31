import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq, inArray, lt, sql } from "drizzle-orm";

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

const PRESIGN_EXPIRES_SECONDS = 10 * 60; // 10 minutes
const PENDING_EXPIRES_MS = 10 * 60 * 1000;
const CLEANUP_BATCH_SIZE = 50;
const DEFAULT_STORAGE_LIMIT = 1_073_741_824; // 1GB
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Allowed content types - extend as needed
const ALLOWED_CONTENT_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/svg+xml",
	"application/pdf",
	"text/plain",
	"text/csv",
	"application/json",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function validateFileSize(size: number | undefined): number {
	if (!size) {
		throw new Error("File size is required");
	}
	if (size <= 0) {
		throw new Error("File size must be positive");
	}
	if (size > MAX_FILE_SIZE) {
		throw new Error(
			`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
		);
	}
	return size;
}

function validateContentType(contentType: string): void {
	if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
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
	{ fileName, contentType, visibility, size }: PresignParams,
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
	console.log(fileKeys);

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

		// Authorization check
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
	} = {},
) {
	const { organizationId, status, limit = 50, offset = 0 } = options;

	const conditions = [];

	if (organizationId) {
		conditions.push(eq(uploads.organizationId, organizationId));
	} else {
		conditions.push(eq(uploads.userId, user.id));
	}

	if (status) {
		conditions.push(eq(uploads.status, status));
	}

	const results = await db
		.select()
		.from(uploads)
		.where(and(...conditions))
		.limit(limit)
		.offset(offset)
		.orderBy(sql`${uploads.createdAt} DESC`);

	return results;
}
