import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ErrorSchema } from "@/middleware/error-handler";

// Helper for standardized error responses
export const handleRouteError = (
	c: Context,
	error: unknown,
	message: string,
	statusCode = 500,
) => {
	if (
		error instanceof Error &&
		error.message === "organizationId is required"
	) {
		const errorResponse: ErrorSchema = {
			success: false,
			error: {
				name: "BadRequestError",
				issues: [
					{
						code: "ORGANIZATION_ID_REQUIRED",
						path: [],
						message: error.message,
					},
				],
			},
		};
		return c.json(errorResponse, 400);
	}
	console.error(`Error ${message}:`, error);
	const errorResponse: ErrorSchema = {
		success: false,
		error: {
			name: "InternalServerError",
			message: `An error occurred while trying to ${message}`,
			issues: [
				{
					code: "INTERNAL_ERROR",
					path: [],
					message: (error as any).cause || `Failed to ${message}`,
				},
			],
		},
	};
	return c.json(errorResponse, statusCode as ContentfulStatusCode);
};
