export function getTenantSlug(): string | null | undefined {
	if (typeof window === "undefined") return null;

	const hostname = window.location.hostname;
	// Handle localhost with subdomain (e.g., demo.localhost)
	// Handle production subdomains (e.g., demo.my-app.com)

	const parts = hostname.split(".");

	// If localhost, parts.length > 1 means subdomain (e.g. ['demo', 'localhost'])
	// If production (example.com), parts.length > 2 means subdomain (e.g. ['demo', 'example', 'com'])
	// But we need to be careful about www or no subdomain.

	// Simple heuristic:
	// - if localhost, take first part if more than 1 part.
	// - if not localhost, take first part if not www and parts > 2.

	if (hostname.includes("localhost")) {
		if (parts.length > 1) {
			return parts[0];
		}
		return null;
	}

	// For production, assume 2-level TLD might be tricky, but let's assume standard domain.com
	if (parts.length > 2) {
		if (parts[0] === "www") return null;
		return parts[0];
	}

	return null;
}
