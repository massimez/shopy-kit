import { headers } from "next/headers";

/**
 * Extracts subdomain slug from host header
 * Supports both localhost (subdomain.localhost) and production (subdomain.example.com)
 */
export async function getTenantSlugServer(): Promise<string | undefined> {
	const headersList = await headers();
	const host = headersList.get("host") || "";
	const parts = host.split(".");

	// localhost: subdomain.localhost:3000 -> ["subdomain", "localhost:3000"]
	if (host.includes("localhost")) {
		return parts.length > 1 ? parts[0] : undefined;
	}

	// production: subdomain.example.com -> ["subdomain", "example", "com"]
	// Ignore www subdomain
	if (parts.length > 2 && parts[0] !== "www") {
		return parts[0];
	}

	return undefined;
}
