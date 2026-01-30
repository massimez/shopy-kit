import { createRouter } from "@/lib/create-hono-app";
import { clientRoute } from "./client/route";
import { inventoryRoute } from "./inventory/route";
import { orderRoute } from "./order/route";
import { productCollectionRoute } from "./product/product-collection/route";
import { productReviewRoute } from "./product/product-review/route";
import { productVariantRoute } from "./product/product-variant/route";
import { productRoute } from "./product/route";
import { rewardsRoutes } from "./rewards";
import { shippingMethodZoneRoute } from "./shipping/method-zone";
import { shippingMethodRoute } from "./shipping/shipping";
import { shippingZoneRoute } from "./shipping/zone";
import { brandRoute } from "./supplier/brand/route";
import { supplierRoute } from "./supplier/route";

// Combine all store-related routes into a single router
export const storeRoute = createRouter()
	.route("/", clientRoute)
	.route("/", productRoute)
	.route("/", productVariantRoute)
	.route("/", productCollectionRoute)
	.route("/", productReviewRoute)
	.route("/", inventoryRoute)
	.route("/", supplierRoute)
	.route("/", brandRoute)
	.route("/", shippingMethodRoute)
	.route("/", shippingZoneRoute)
	.route("/", shippingMethodZoneRoute)
	.route("/", orderRoute)
	.route("/", rewardsRoutes);
