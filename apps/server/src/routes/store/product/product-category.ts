import { and, eq, sql } from "drizzle-orm";
import { db } from "starter-db";
import { productCategory } from "starter-db/schema";
import z from "zod";
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
import {
	insertProductCategorySchema,
	updateProductCategorySchema,
} from "./schema";

const getProductCategoriesQuerySchema = z.object({
	lang: z.string().length(2).optional(),
});

// --------------------
// Product Category Routes
// --------------------
export const productCategoryRoute = createRouter()
	.post(
		"/product-categories",
		authMiddleware,
		hasOrgPermission("productCategory:create"),
		jsonValidator(insertProductCategorySchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const data = c.req.valid("json");
				const [newProductCategory] = await db
					.insert(productCategory)
					.values({ ...data, organizationId: activeOrgId })
					.returning();
				return c.json(newProductCategory, 201);
			} catch (error) {
				return handleRouteError(c, error, "create product category");
			}
		},
	)
	.get(
		"/product-categories",
		authMiddleware,
		hasOrgPermission("productCategory:read"),
		queryValidator(getProductCategoriesQuerySchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;

				const whereConditions = [
					eq(productCategory.organizationId, activeOrgId),
				];

				const foundProductCategories = await db
					.select()
					.from(productCategory)
					.where(and(...whereConditions));

				return c.json({ data: foundProductCategories });
			} catch (error) {
				return handleRouteError(c, error, "fetch product categories");
			}
		},
	)
	.get(
		"/product-categories/:id",
		authMiddleware,
		hasOrgPermission("productCategory:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [foundProductCategory] = await db
					.select()
					.from(productCategory)
					.where(
						and(
							eq(productCategory.id, id),
							eq(productCategory.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.limit(1);
				if (!foundProductCategory)
					return c.json({ error: "Product category not found" }, 404);
				return c.json(foundProductCategory);
			} catch (error) {
				return handleRouteError(c, error, "fetch product category");
			}
		},
	)
	.put(
		"/product-categories/:id",
		authMiddleware,
		hasOrgPermission("productCategory:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateProductCategorySchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const [updatedProductCategory] = await db
					.update(productCategory)
					.set(data)
					.where(
						and(
							eq(productCategory.id, id),
							eq(productCategory.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!updatedProductCategory)
					return c.json({ error: "Product category not found" }, 404);
				return c.json(updatedProductCategory);
			} catch (error) {
				return handleRouteError(c, error, "update product category");
			}
		},
	)
	.delete(
		"/product-categories/:id",
		authMiddleware,
		hasOrgPermission("productCategory:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [deletedProductCategory] = await db
					.delete(productCategory)
					.where(
						and(
							eq(productCategory.id, id),
							eq(productCategory.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!deletedProductCategory)
					return c.json({ error: "Product category not found" }, 404);
				return c.json({
					message: "Product category deleted successfully",
					deletedProductCategory,
				});
			} catch (error) {
				return handleRouteError(c, error, "delete product category");
			}
		},
	);
