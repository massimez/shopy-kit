import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { validator } from "hono/validator";
import z from "zod";

// Helper function to validate organization ID
export const validateOrgId = (orgId: string | undefined) => {
	if (!orgId) {
		throw new Error("organizationId is required");
	}
	return orgId;
};

export const queryOrgIdSchema = z.object({
	organizationId: z.string().min(1, "organizationId is required"),
});

// JSON validator factory
// biome-ignore lint/suspicious/noExplicitAny: This is a generic validator factory
export const createValidator = (schema: any) =>
	validator("json", (value, c) => {
		const parsed = schema.safeParse(value);
		if (!parsed.success) {
			return c.json({ parsed }, 400);
		}
		return parsed.data;
	});

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
		return c.json({ error: error.message }, 400);
	}
	console.error(`Error ${message}:`, error);
	return c.json(
		{ error: `Failed to ${message}` },
		statusCode as ContentfulStatusCode,
	);
};
