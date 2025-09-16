export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	pagination: {
		offset: number;
		limit: number;
		total: number;
	};
}

export type OffsetPaginationParams = {
	limit: number;
	offset: number;
	orderBy?: string;
	direction?: "asc" | "desc";
};

/**
 * Create success API response
 */
export function createApiResponse<T>(
	data: T,
	message?: string,
): ApiResponse<T> {
	return {
		success: true,
		data,
		message,
	};
}

/**
 * Create error API response
 */
export function createErrorResponse(
	error: string,
	message?: string,
): ApiResponse<never> {
	return {
		success: false,
		error,
		message,
	};
}
