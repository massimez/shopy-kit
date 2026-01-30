import { createRouter } from "@/lib/create-hono-app";
import { tenantMiddleware } from "@/middleware/tenant-middleware";
import { clientRoute } from "./client/route";
import { collectionsRoutes } from "./collections/route";
import { locationRoutes } from "./locations/route";
import { ordersRoutes } from "./orders/route";
import { organizationRoutes } from "./organization/route";
import { productsRoutes } from "./products/route";
import { rewardsRoutes } from "./rewards/route";

export const storefrontRoutes = createRouter()
	.use("*", tenantMiddleware)
	.route("/products", productsRoutes)
	.route("/orders", ordersRoutes)
	.route("/collections", collectionsRoutes)
	.route("/locations", locationRoutes)
	.route("/organizations", organizationRoutes)
	.route("/client", clientRoute)
	.route("/rewards", rewardsRoutes);

export default storefrontRoutes;
