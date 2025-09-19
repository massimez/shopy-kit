import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
	productVariantBatch,
	productVariantStock,
	productVariantStockTransaction,
} from "starter-db/schema";
import { idAndAuditFields } from "@/helpers/constant/fields";

export const insertProductVariantBatchSchema =
	createInsertSchema(productVariantBatch);
export const updateProductVariantBatchSchema = createSelectSchema(
	productVariantBatch,
)
	.omit(idAndAuditFields)
	.partial();

export const insertProductVariantStockSchema =
	createInsertSchema(productVariantStock);
export const updateProductVariantStockSchema = createSelectSchema(
	productVariantStock,
)
	.omit(idAndAuditFields)
	.partial();

export const insertProductVariantStockTransactionSchema = createInsertSchema(
	productVariantStockTransaction,
);
export const updateProductVariantStockTransactionSchema = createSelectSchema(
	productVariantStockTransaction,
)
	.omit(idAndAuditFields)
	.partial();
