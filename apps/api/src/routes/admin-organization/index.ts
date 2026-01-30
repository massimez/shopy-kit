import { createRouter } from "@/lib/create-hono-app";
import { authMiddleware } from "@/middleware/auth";
import { financialRoute } from "./financial";
import { locationRoute } from "./organization/location/location";
import { organizationInfoRoute } from "./organization/organization-info";
import { storeRoute } from "./store";

export const adminOrganizationRoutes = createRouter()
	.use("*", authMiddleware)
	.route("/financial", financialRoute)
	.route("/organizations", locationRoute)
	.route("/organizations", organizationInfoRoute)
	.route("/store", storeRoute);
