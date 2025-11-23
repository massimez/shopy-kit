import { eq } from "drizzle-orm";
import { z } from "zod";
import { createRouter } from "@/lib/create-hono-app";
import { db } from "@/lib/db";
import { organization } from "@/lib/db/schema";
import {
	createErrorResponse,
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import { queryValidator } from "@/lib/utils/validator";
import { getOrganizationBasicInfoBySlug } from "../../admin-organization/organization/organization-info.service";

export const organizationRoutes = createRouter().get(
	"/info",
	queryValidator(
		z.object({
			orgSlug: z.string().optional(),
			organizationId: z.string().optional(),
		}),
	),
	async (c) => {
		try {
			const { orgSlug, organizationId } = c.req.valid("query");

			let slug = orgSlug;

			if (!slug && organizationId) {
				const org = await db.query.organization.findFirst({
					where: eq(organization.id, organizationId),
					columns: { slug: true },
				});
				if (org) slug = org.slug || undefined;
			}

			if (!slug) {
				return c.json(
					createErrorResponse(
						"BadRequest",
						"orgSlug or organizationId is required",
						[
							{
								code: "MISSING_PARAM",
								path: ["orgSlug", "organizationId"],
								message: "orgSlug or organizationId is required",
							},
						],
					),
					400,
				);
			}

			const info = await getOrganizationBasicInfoBySlug(slug);

			if (!info) {
				return c.json(
					createErrorResponse("NotFoundError", "Organization not found", [
						{
							code: "RESOURCE_NOT_FOUND",
							path: ["orgSlug"],
							message: "Organization not found",
						},
					]),
					404,
				);
			}

			return c.json(createSuccessResponse(info));
		} catch (error) {
			return handleRouteError(c, error, "fetch organization info");
		}
	},
);
