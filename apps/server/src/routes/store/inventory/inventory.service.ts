import { and, eq, getTableColumns, sql, sum } from "drizzle-orm";
import { db } from "starter-db";
import {
	location,
	product,
	productVariant,
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
	productVariantId: string | undefined,
	orgId: string,
	paginationParams: OffsetPaginationParams,
) {
	const filters = [];

	if (productVariantId) {
		filters.push(
			eq(productVariantStockTransaction.productVariantId, productVariantId),
		);
	}

	const queryWithJoins = db
		.select({
			...getTableColumns(productVariantStockTransaction),
			locationName: location.name,
		})
		.from(productVariantStockTransaction)
		.innerJoin(
			location,
			eq(location.id, productVariantStockTransaction.locationId),
		);

	const result = await withPaginationAndTotal({
		db: db,
		query: queryWithJoins,
		baseFilters: filters.length > 1 ? and(...filters) : filters[0],
		table: productVariantStockTransaction,
		params: paginationParams,
		orgId: validateOrgId(orgId),
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
	return await db.transaction(async (tx) => {
		const [newBatch] = await tx
			.insert(productVariantBatch)
			.values({
				...data,
				organizationId: orgId,
			})
			.returning();

		// Create a stock transaction to sync batch stock with main stock
		const [newTransaction] = await tx
			.insert(productVariantStockTransaction)
			.values({
				productVariantId: data.productVariantId,
				organizationId: orgId,
				locationId: data.locationId,
				quantityChange: data.quantity || 0,
				reason: "purchase", // Reason for adding stock via batch
			})
			.returning();

		// Update productVariantStock based on this transaction
		await updateStockAfterTransaction(newTransaction, tx);

		return newBatch;
	});
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

/**
 * Get product variants grouped by product with inventory stock
 */
export async function getProductVariantsGroupedByProductWithStock(
	orgId: string,
	locationId?: string,
) {
	const orgIdValidated = validateOrgId(orgId);

	// Single query with joins and aggregation
	const result = await db
		.select({
			// Product fields
			productId: product.id,
			productName: product.name,
			productTranslations: product.translations,
			// Variant fields
			variantId: productVariant.id,
			variantSku: productVariant.sku,
			variantPrice: productVariant.price,
			variantTranslations: productVariant.translations,
			// Aggregated stock fields
			totalQuantity:
				sql<number>`COALESCE(SUM(${productVariantStock.quantity}), 0)`.as(
					"total_quantity",
				),
			totalReservedQuantity:
				sql<number>`COALESCE(SUM(${productVariantStock.reservedQuantity}), 0)`.as(
					"total_reserved",
				),
		})
		.from(product)
		.innerJoin(productVariant, eq(productVariant.productId, product.id))
		.leftJoin(
			productVariantStock,
			and(
				eq(productVariantStock.productVariantId, productVariant.id),
				eq(productVariantStock.organizationId, orgIdValidated),
				locationId ? eq(productVariantStock.locationId, locationId) : undefined,
			),
		)
		.where(
			and(
				eq(product.organizationId, orgIdValidated),
				eq(productVariant.organizationId, orgIdValidated),
				locationId ? eq(productVariantStock.locationId, locationId) : undefined,
			),
		)
		.groupBy(
			product.id,
			product.name,
			product.translations,
			productVariant.id,
			productVariant.sku,
			productVariant.price,
			productVariant.translations,
		)
		.orderBy(product.createdAt, productVariant.createdAt);

	// Group results by product
	const productMap = new Map();

	result.forEach((row) => {
		const productId = row.productId;

		if (!productMap.has(productId)) {
			productMap.set(productId, {
				id: productId,
				name: row.productName,
				translations: row.productTranslations,
				variants: [],
			});
		}

		const product = productMap.get(productId);
		product.variants.push({
			id: row.variantId,
			sku: row.variantSku,
			price: row.variantPrice ? Number(row.variantPrice) : undefined,
			translations: row.variantTranslations,
			stock: {
				quantity: Number(row.totalQuantity),
				reservedQuantity: Number(row.totalReservedQuantity),
			},
		});
	});

	return Array.from(productMap.values());
}
