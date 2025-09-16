import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
	product,
	productCategory,
	productCategoryAssignment,
	productCategoryTranslation,
	productReview,
	productSupplier,
	productTranslation,
	productVariant,
	productVariantAttribute,
	productVariantStock,
	productVariantTranslation,
} from "starter-db/schema";
import { idAndAuditFields } from "@/helpers/constant/fields";

export const insertProductSchema = createInsertSchema(product);
export const updateProductSchema = createSelectSchema(product).partial();

export const insertProductCategorySchema = createInsertSchema(productCategory);
export const updateProductCategorySchema = createSelectSchema(productCategory)
	.omit(idAndAuditFields)
	.partial();

export const insertProductCategoryTranslationSchema = createInsertSchema(
	productCategoryTranslation,
);
export const updateProductCategoryTranslationSchema = createSelectSchema(
	productCategoryTranslation,
)
	.omit(idAndAuditFields)
	.partial();

export const insertProductTranslationSchema =
	createInsertSchema(productTranslation);
export const updateProductTranslationSchema = createSelectSchema(
	productTranslation,
)
	.omit(idAndAuditFields)
	.partial();

export const insertProductVariantSchema = createInsertSchema(productVariant);
export const updateProductVariantSchema = createSelectSchema(productVariant)
	.omit(idAndAuditFields)
	.partial();

export const insertProductVariantTranslationSchema = createInsertSchema(
	productVariantTranslation,
);
export const updateProductVariantTranslationSchema = createSelectSchema(
	productVariantTranslation,
)
	.omit(idAndAuditFields)
	.partial();

export const insertProductVariantAttributeSchema = createInsertSchema(
	productVariantAttribute,
);
export const updateProductVariantAttributeSchema = createSelectSchema(
	productVariantAttribute,
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

export const insertProductCategoryAssignmentSchema = createInsertSchema(
	productCategoryAssignment,
);
export const updateProductCategoryAssignmentSchema = createSelectSchema(
	productCategoryAssignment,
)
	.omit(idAndAuditFields)
	.partial();

export const insertProductSupplierSchema = createInsertSchema(productSupplier);
export const updateProductSupplierSchema =
	createSelectSchema(productSupplier).partial();

export const insertProductReviewSchema = createInsertSchema(productReview);
export const updateProductReviewSchema = createSelectSchema(productReview)
	.omit(idAndAuditFields)
	.partial();
