import auth from "@/routes/auth";
import healthRoutes from "@/routes/health";
import { locationRoute } from "@/routes/organization/location";
import { organizationInfoRoute } from "@/routes/organization/organization-info";
import storageRoutes from "@/routes/storage";
import { productRoute } from "@/routes/store/product/product";
import { productCategoryRoute } from "@/routes/store/product/product-category";
import { productReviewRoute } from "@/routes/store/product/product-review";
import { productVariantRoute } from "@/routes/store/product/product-variant";
import { brandRoute } from "@/routes/store/supplier/brand";
import { supplierRoute } from "@/routes/store/supplier/supplier";
import createApp from "./create-hono-app";

const app = createApp()
	.basePath("/api")
	.route("/", healthRoutes)
	.route("/", auth)
	.route("/organizations", locationRoute)
	.route("/organizations", organizationInfoRoute)
	.route("/storage", storageRoutes)
	.route("/store", productRoute)
	.route("/store", productVariantRoute)
	.route("/store", productCategoryRoute)
	.route("/store", productReviewRoute)
	.route("/store", supplierRoute)
	.route("/store", brandRoute);

export const honoApp = app;
export type App = typeof honoApp;
