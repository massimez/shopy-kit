import { and, eq } from "drizzle-orm";
import { db } from "starter-db";
import {
	productVariantBatch,
	productVariantStock,
	productVariantStockTransaction,
} from "starter-db/schema";
import type { z } from "zod";
import { withPaginationAndTotal } from "@/helpers/pagination";
import { validateOrgId } from "@/lib/utils/validator";
import type { offsetPaginationSchema } from "@/middleware/pagination";
import type {
	insertProductVariantBatchSchema,
	insertProductVariantStockTransactionSchema,
} from "./schema";

type OffsetPaginationParams = z.infer<typeof offsetPaginationSchema>;
type InsertProductVariantBatch = z.infer<
	typeof insertProductVariantBatchSchema
>;
type InsertProductVariantStockTransaction = z.infer<
	typeof insertProductVariantStockTransactionSchema
>;

/**
 * Get product variant stock
 */
export async function getProductVariantStock(
	productVariantId: string,
	orgId: string,
) {
	const [stock] = await db
		.select()
		.from(productVariantStock)
		.where(
			and(
				eq(productVariantStock.productVariantId, productVariantId),
				eq(productVariantStock.organizationId, validateOrgId(orgId)),
			),
		)
		.limit(1);

	return stock || { quantity: 0, reservedQuantity: 0 };
}

/**
 * Create stock transaction and update stock accordingly
 */
export async function createStockTransaction(
	data: InsertProductVariantStockTransaction,
	orgId: string,
) {
	return await db.transaction(async (tx) => {
		const [newTransaction] = await tx
			.insert(productVariantStockTransaction)
			.values({
				...data,
				organizationId: orgId,
			})
			.returning();

		// Update productVariantStock based on this transaction
		await updateStockAfterTransaction(newTransaction, tx);

		return newTransaction;
	});
}

/**
 * Update product variant stock after a transaction
 */
export async function updateStockAfterTransaction(
	transaction: typeof productVariantStockTransaction.$inferSelect,
	_db: Pick<typeof db, "select" | "update" | "insert"> = db,
) {
	const { productVariantId, organizationId, locationId, quantityChange } =
		transaction;

	const [currentStock] = await _db
		.select()
		.from(productVariantStock)
		.where(
			and(
				eq(productVariantStock.productVariantId, productVariantId),
				eq(productVariantStock.organizationId, organizationId),
				eq(productVariantStock.locationId, locationId),
			),
		);

	if (currentStock) {
		await _db
			.update(productVariantStock)
			.set({ quantity: currentStock.quantity + quantityChange })
			.where(
				and(
					eq(productVariantStock.productVariantId, productVariantId),
					eq(productVariantStock.organizationId, organizationId),
					eq(productVariantStock.locationId, locationId),
				),
			);
	} else {
		await _db.insert(productVariantStock).values({
			productVariantId,
			organizationId,
			locationId,
			quantity: quantityChange,
			reservedQuantity: 0, // Assuming new stock starts with 0 reserved
		});
	}
}

/**
 * Get stock transactions with pagination
 */
export async function getStockTransactions(
	productVariantId: string,
	orgId: string,
	paginationParams: OffsetPaginationParams,
) {
	const result = await withPaginationAndTotal({
		db: db,
		query: db.select().from(productVariantStockTransaction),
		baseFilters: and(
			eq(productVariantStockTransaction.productVariantId, productVariantId),
			eq(productVariantStockTransaction.organizationId, validateOrgId(orgId)),
		),
		table: productVariantStockTransaction,
		params: paginationParams,
		orgId: orgId,
	});

	return { total: result.total, data: result.data };
}

/**
 * Create product variant batch
 */
export async function createProductVariantBatch(
	data: InsertProductVariantBatch,
	orgId: string,
) {
	const [newBatch] = await db
		.insert(productVariantBatch)
		.values({
			...data,
			organizationId: orgId,
		})
		.returning();

	return newBatch;
}

/**
 * Get product variant batches
 */
export async function getProductVariantBatches(
	productVariantId: string,
	organizationId: string,
) {
	const foundBatches = await db
		.select()
		.from(productVariantBatch)
		.where(
			and(
				eq(productVariantBatch.productVariantId, productVariantId),
				eq(productVariantBatch.organizationId, organizationId),
			),
		);
	return foundBatches;
}
