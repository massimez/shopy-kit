import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { order, orderItem } from "@/lib/db/schema/store/order";

export async function getStorefrontOrders(params: {
	organizationId: string;
	userId: string; // Mandatory for fetching list of orders
	limit?: number;
	offset?: number;
}) {
	const { organizationId, userId, limit = 20, offset = 0 } = params;

	const orders = await db
		.select()
		.from(order)
		.where(
			and(eq(order.organizationId, organizationId), eq(order.userId, userId)),
		)
		.orderBy(desc(order.createdAt))
		.limit(limit)
		.offset(offset);

	return orders;
}

export async function getStorefrontOrder(params: {
	organizationId: string;
	orderId: string;
	userId?: string;
}) {
	const { organizationId, orderId, userId } = params;

	const conditions = [
		eq(order.id, orderId),
		eq(order.organizationId, organizationId),
	];

	if (userId) {
		conditions.push(eq(order.userId, userId));
	}

	const foundOrder = await db
		.select()
		.from(order)
		.where(and(...conditions))
		.limit(1);

	if (!foundOrder.length) return null;

	const items = await db
		.select()
		.from(orderItem)
		.where(eq(orderItem.orderId, orderId));

	return {
		...foundOrder[0],
		items,
	};
}
