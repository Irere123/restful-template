import rateLimit from "express-rate-limit";

import config from "@api/config";

/** Standard JSON shape returned when a client is rate limited. */
const limitResponse = {
	error: "TOO_MANY_REQUESTS",
	message: "Too many requests, please try again later",
};

/** Global limiter applied to every request. */
export const globalRateLimiter = rateLimit({
	windowMs: config.rateLimitWindowMs,
	limit: config.rateLimitMaxRequests,
	standardHeaders: "draft-7",
	legacyHeaders: false,
	message: limitResponse,
});

/**
 * Stricter limiter for authentication endpoints to slow credential-stuffing
 * and brute-force attempts. Keyed by IP.
 */
export const authRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 10,
	standardHeaders: "draft-7",
	legacyHeaders: false,
	message: limitResponse,
	// Don't count successful logins/registrations against the limit.
	skipSuccessfulRequests: true,
});
