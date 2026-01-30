import type { Context, Next } from "hono";
import { rateLimit } from "@/lib/redis/rate-limit";
import { createErrorResponse } from "./error-handler";

export function rateLimiter(windowMs = 60000, max = 100) {
	return async (c: Context, next: Next) => {
		const ip =
			c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
		const path = c.req.path;
		const method = c.req.method;

		// Create a unique identifier for the rate limit key
		const identifier = `${ip}`;
		const routeKey = `${method}:${path}`;

		try {
			const { success, reset, remaining } = await rateLimit(
				identifier,
				routeKey,
				max,
				Math.ceil(windowMs / 1000),
			);

			// Set standard rate limit headers
			c.header("X-RateLimit-Limit", max.toString());
			c.header("X-RateLimit-Remaining", remaining.toString());
			c.header("X-RateLimit-Reset", reset.toString());

			if (!success) {
				const retryAfter = Math.max(0, reset - Math.floor(Date.now() / 1000));
				c.header("Retry-After", retryAfter.toString());

				return c.json(
					createErrorResponse("TooManyRequestsError", "Too many requests", [
						{
							code: "RATE_LIMIT_EXCEEDED",
							path: [],
							message: "Please try again later",
						},
					]),
					429,
				);
			}

			await next();
		} catch (error) {
			console.error("Rate limiter error:", error);
			// Fail open - allow request if rate limiter fails
			await next();
		}
	};
}
