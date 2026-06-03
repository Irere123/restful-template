import rateLimit from "express-rate-limit";

/** Standard JSON shape returned when a client is rate limited. */
const limitResponse = {
	error: "TOO_MANY_REQUESTS",
	message: "Too many requests, please try again later",
};

export interface RateLimitOptions {
	windowMs: number;
	max: number;
}

/** Global limiter applied to every request reaching a service. */
export const createGlobalRateLimiter = ({ windowMs, max }: RateLimitOptions) =>
	rateLimit({
		windowMs,
		limit: max,
		standardHeaders: "draft-7",
		legacyHeaders: false,
		message: limitResponse,
	});

/**
 * Stricter limiter for authentication endpoints to slow credential-stuffing
 * and brute-force attempts. Keyed by IP; successful requests don't count.
 */
export const createAuthRateLimiter = () =>
	rateLimit({
		windowMs: 15 * 60 * 1000, // 15 minutes
		limit: 10,
		standardHeaders: "draft-7",
		legacyHeaders: false,
		message: limitResponse,
		skipSuccessfulRequests: true,
	});
