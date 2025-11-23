import { z } from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import { queryValidator } from "@/lib/utils/validator";
import { getStorefrontCollections } from "./collections.service";

export const collectionsRoutes = createRouter().get(
	"/",
	queryValidator(
		z.object({
			organizationId: z.string().min(1),
		}),
	),
	async (c) => {
		try {
			const { organizationId } = c.req.valid("query");
			const collections = await getStorefrontCollections({ organizationId });
			return c.json(createSuccessResponse(collections));
		} catch (error) {
			return handleRouteError(c, error, "fetch storefront collections");
		}
	},
);
