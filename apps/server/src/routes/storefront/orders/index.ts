import { z } from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
	createErrorResponse,
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import { paramValidator, queryValidator } from "@/lib/utils/validator";
import { getStorefrontOrder, getStorefrontOrders } from "./orders.service";

export const ordersRoutes = createRouter()
	.get(
		"/",
		queryValidator(
			z.object({
				organizationId: z.string().min(1),
				userId: z.string().min(1),
				limit: z.coerce.number().default(20),
				offset: z.coerce.number().default(0),
			}),
		),
		async (c) => {
			try {
				const query = c.req.valid("query");
				const orders = await getStorefrontOrders(query);
				return c.json(createSuccessResponse(orders));
			} catch (error) {
				return handleRouteError(c, error, "fetch storefront orders");
			}
		},
	)
	.get(
		"/:orderId",
		paramValidator(
			z.object({
				orderId: z.string().min(1),
			}),
		),
		queryValidator(
			z.object({
				organizationId: z.string().min(1),
				userId: z.string().optional(),
			}),
		),
		async (c) => {
			try {
				const { orderId } = c.req.valid("param");
				const { organizationId, userId } = c.req.valid("query");
				const order = await getStorefrontOrder({
					organizationId,
					orderId,
					userId,
				});

				if (!order) {
					return c.json(
						createErrorResponse("NotFoundError", "Order not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["orderId"],
								message: "Order not found",
							},
						]),
						404,
					);
				}

				return c.json(createSuccessResponse(order));
			} catch (error) {
				return handleRouteError(c, error, "fetch storefront order");
			}
		},
	);
