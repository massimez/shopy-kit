import { extractErrorMessage } from "@workspace/ui/lib/utils";
import { hc } from "./api-client";

interface UploadResult {
	key: string;
	publicUrl: string;
}

// Main upload function
export async function uploadPublic(
	file: File,
	folderId?: string | null,
): Promise<UploadResult> {
	// Validate file
	if (!file || !(file instanceof File)) {
		throw new Error("Invalid file provided");
	}

	try {
		// Step 1: Get presigned URL
		const presignRes = await hc.api.storage.presign.$post({
			json: {
				fileName: file.name,
				contentType: file.type,
				visibility: "public",
				size: file.size,
				folderId: folderId || undefined,
			},
		});

		if (!presignRes.ok) {
			throw new Error("Failed to get presigned URL");
		}

		const { data } = await presignRes.json();

		// Validate presigned URL response
		if (!data?.url || !data.key || !data.publicUrl) {
			throw new Error("Invalid presigned URL response");
		}

		// Step 2: Upload file to presigned URL
		const uploadRes = await fetch(data.url, {
			method: "PUT",
			body: file,
			headers: {
				"Content-Type": file.type,
				...(typeof window !== "undefined" && {
					Origin: window.location.origin,
				}),
			},
		});

		if (!uploadRes.ok) {
			const errorDetail = await extractErrorMessage(uploadRes);
			throw new Error(`Failed to upload file: ${errorDetail}`);
		}

		return {
			key: data.key,
			publicUrl: data.publicUrl,
		};
	} catch (error) {
		// Enhanced error logging
		console.error("Error in uploadPublic:", {
			fileName: file.name,
			fileType: file.type,
			fileSize: file.size,
			error: error instanceof Error ? error.message : String(error),
		});

		// Check for specific error messages
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.includes("Storage limit exceeded")) {
			throw new Error(
				"Storage limit exceeded. Please contact your administrator.",
			);
		}

		// Re-throw with context
		throw new Error(
			`File upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export async function deleteFile(key: string): Promise<boolean> {
	if (!key || typeof key !== "string") {
		throw new Error("Invalid file key provided");
	}

	try {
		const res = await hc.api.storage[":key"].$delete({
			param: { key: encodeURIComponent(key) },
		});

		if (!res.ok) {
			const errorDetail = await extractErrorMessage(res);

			throw new Error(`Failed to delete file: ${errorDetail}`);
		}

		return true;
	} catch (error) {
		console.error("Error in deleteFile:", {
			key,
			error: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
}

export async function moveFile(
	key: string,
	folderId: string | null,
): Promise<MediaFile> {
	if (!key || typeof key !== "string") {
		throw new Error("Invalid file key provided");
	}

	try {
		const res = await hc.api.storage[":key"].$patch({
			param: { key: encodeURIComponent(key) },
			json: { folderId },
		});

		if (!res.ok) {
			const errorDetail = await extractErrorMessage(res);
			throw new Error(`Failed to move file: ${errorDetail}`);
		}

		const { data } = await res.json();
		if (!data) {
			throw new Error("No data returned from move operation");
		}
		return data as MediaFile;
	} catch (error) {
		console.error("Error in moveFile:", {
			key,
			folderId,
			error: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
}

export interface MediaFile {
	id: string;
	fileKey: string;
	bucket: string;
	contentType: string | null;
	size: number | null;
	// biome-ignore lint/suspicious/noExplicitAny: <>
	metadata: any;
	userId: string | null;
	organizationId: string | null;
	folderId: string | null;
	status: string;
	expiresAt: string | null;
	createdAt: string;
	updatedAt: string | null;
	deletedAt: string | null;
	createdBy: string | null;
	updatedBy: string | null;
	publicUrl: string;
}

export interface ListUploadsOptions {
	page?: number;
	limit?: number;
	status?: "pending" | "committed" | "deleted";
	search?: string;
	folderId?: string | null;
}

export async function listFiles(
	options: ListUploadsOptions = {},
): Promise<MediaFile[]> {
	const { page = 1, limit = 50, status, search, folderId } = options;

	const res = await hc.api.storage.$get({
		query: {
			page: page.toString(),
			limit: limit.toString(),
			...(status && { status }),
			...(search && { search }),
			folderId: folderId === null ? "null" : folderId,
		},
	});

	if (!res.ok) {
		const errorDetail = await extractErrorMessage(res);
		throw new Error(`Failed to list files: ${errorDetail}`);
	}

	const { data } = await res.json();
	return data ?? [];
}

/* -------------------------- Folder Management ----------------------------- */

export interface StorageFolder {
	id: string;
	name: string;
	parentId: string | null;
	organizationId: string | null;
	createdAt: string;
	updatedAt: string | null;
	deletedAt: string | null;
	createdBy: string | null;
	updatedBy: string | null;
}

export async function createFolder(
	name: string,
	parentId?: string | null,
): Promise<StorageFolder> {
	const res = await hc.api.storage.folders.$post({
		json: {
			name,
			parentId: parentId || undefined,
		},
	});

	if (!res.ok) {
		const errorDetail = await extractErrorMessage(res);
		throw new Error(`Failed to create folder: ${errorDetail}`);
	}

	const { data } = await res.json();
	if (!data) {
		throw new Error("No data returned from create folder operation");
	}
	return data as StorageFolder;
}

export async function listFolders(
	parentId?: string | null,
): Promise<StorageFolder[]> {
	const res = await hc.api.storage.folders.$get({
		query: {
			parentId: parentId === null ? "null" : parentId,
		},
	});

	if (!res.ok) {
		const errorDetail = await extractErrorMessage(res);
		throw new Error(`Failed to list folders: ${errorDetail}`);
	}

	const { data } = await res.json();
	return data ?? [];
}

export async function deleteFolder(id: string): Promise<boolean> {
	const res = await hc.api.storage.folders[":id"].$delete({
		param: { id },
	});

	if (!res.ok) {
		const errorDetail = await extractErrorMessage(res);
		throw new Error(`Failed to delete folder: ${errorDetail}`);
	}

	return true;
}
