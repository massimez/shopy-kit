import { and, eq } from "drizzle-orm";
import { db } from "starter-db";
import { product, type TProductStatus } from "starter-db/schema";
import { withPaginationAndTotal } from "@/helpers/pagination";
import { createRouter } from "@/lib/create-hono-app";
import { handleRouteError } from "@/lib/utils/route-helpers";
import {
	idParamSchema,
	jsonValidator,
	paramValidator,
	queryValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import { offsetPaginationSchema } from "@/middleware/pagination";
import { insertProductSchema, updateProductSchema } from "./schema";

// --------------------
// Product Routes
// --------------------
export const productRoute = createRouter()
	.post(
		"/products",
		authMiddleware,
		hasOrgPermission("product:create"),
		jsonValidator(insertProductSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { translations, ...productData } = c.req.valid("json");
				const [newProduct] = await db
					.insert(product)
					.values({
						...productData,
						organizationId: activeOrgId,
						status: productData.status as TProductStatus,
						translations: translations,
					})
					.returning();
				return c.json(newProduct, 201);
			} catch (error) {
				return handleRouteError(c, error, "create product");
			}
		},
	)
	.get(
		"/products",
		authMiddleware,
		hasOrgPermission("product:read"),
		queryValidator(offsetPaginationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const paginationParams = c.req.valid("query");

				const result = await withPaginationAndTotal({
					db: db,
					query: null,
					table: product,
					params: paginationParams,
					orgId: activeOrgId,
				});

				return c.json({ total: result.total, data: result.data });
			} catch (error) {
				return handleRouteError(c, error, "fetch products");
			}
		},
	)
	.get(
		"/products/:id",
		authMiddleware,
		hasOrgPermission("product:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [foundProduct] = await db
					.select()
					.from(product)
					.where(
						and(
							eq(product.id, id),
							eq(product.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.limit(1);
				if (!foundProduct) return c.json({ error: "Product not found" }, 404);
				return c.json(foundProduct);
			} catch (error) {
				return handleRouteError(c, error, "fetch product");
			}
		},
	)
	.put(
		"/products/:id",
		authMiddleware,
		hasOrgPermission("product:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateProductSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const { translations, ...productData } = c.req.valid("json");

				const validTranslations = translations
					?.filter((t) => t.languageCode && t.name && t.slug)
					.map((t) => ({
						languageCode: t.languageCode!,
						name: t.name!,
						slug: t.slug!,
						shortDescription: t.shortDescription,
						description: t.description,
						brandName: t.brandName,
						images: t.images,
						seoTitle: t.seoTitle,
						seoDescription: t.seoDescription,
						tags: t.tags,
					}));

				const [updatedProduct] = await db
					.update(product)
					.set({
						...productData,
						status: productData.status as TProductStatus,
						translations: validTranslations,
					})
					.where(
						and(
							eq(product.id, id),
							eq(product.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!updatedProduct) return c.json({ error: "Product not found" }, 404);
				return c.json(updatedProduct);
			} catch (error) {
				return handleRouteError(c, error, "update product");
			}
		},
	)
	.delete(
		"/products/:id",
		authMiddleware,
		hasOrgPermission("product:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [deletedProduct] = await db
					.delete(product)
					.where(
						and(
							eq(product.id, id),
							eq(product.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!deletedProduct) return c.json({ error: "Product not found" }, 404);
				return c.json({
					message: "Product deleted successfully",
					deletedProduct,
				});
			} catch (error) {
				return handleRouteError(c, error, "delete product");
			}
		},
	);
