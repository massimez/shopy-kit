/**
 * Storage Configuration Constants
 *
 * Centralized configuration for all storage-related settings including
 * upload limits, timeouts, quotas, and allowed file types.
 */

export const STORAGE_CONFIG = {
	// Upload limits
	MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
	MAX_IMAGES_PER_ENTITY: 6,

	// Timeouts
	PRESIGN_EXPIRES_SECONDS: 10 * 60, // 10 minutes
	PENDING_EXPIRES_MS: 10 * 60 * 1000, // 10 minutes

	// Batch operations
	CLEANUP_BATCH_SIZE: 50,
	UPLOAD_CONCURRENCY: 5,

	// Storage quotas
	DEFAULT_STORAGE_LIMIT: 1 * 1024 * 1024 * 1024, // 1GB

	// Allowed file types
	ALLOWED_CONTENT_TYPES: [
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
	] as const,

	// File size display
	BYTES_PER_KB: 1024,
	BYTES_PER_MB: 1024 * 1024,
	BYTES_PER_GB: 1024 * 1024 * 1024,
} as const;

export type StorageConfig = typeof STORAGE_CONFIG;

/**
 * Helper function to format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return "0 Bytes";

	const k = STORAGE_CONFIG.BYTES_PER_KB;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Check if a content type is allowed
 */
export function isAllowedContentType(contentType: string): boolean {
	return STORAGE_CONFIG.ALLOWED_CONTENT_TYPES.includes(
		contentType as (typeof STORAGE_CONFIG.ALLOWED_CONTENT_TYPES)[number],
	);
}

/**
 * Validate file size against maximum allowed
 */
export function isValidFileSize(size: number): boolean {
	return size > 0 && size <= STORAGE_CONFIG.MAX_FILE_SIZE;
}
