import { adminRoutes } from "@/routes/admin";
import { adminOrganizationRoutes } from "@/routes/admin-organization";
import auth from "@/routes/auth";
import healthRoutes from "@/routes/health";
import storageRoutes from "@/routes/storage/storage";
import storefrontRoutes from "@/routes/storefront";
import createApp from "./create-hono-app";

const app = createApp()
	.basePath("/api")
	.route("/health", healthRoutes)
	.route("/auth", auth)
	.route("/storage", storageRoutes)
	.route("/storefront", storefrontRoutes)
	.route("/admin", adminRoutes)
	.route("/", adminOrganizationRoutes);

export const honoApp = app;
export type App = typeof honoApp;
