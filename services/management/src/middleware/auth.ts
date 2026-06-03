import config from "@management/config";
import { createOptionalAuth, createRequireAuth, requireRole } from "@repo/core";

/** Stateless JWT guard — verifies the access token with the shared secret. */
export const requireAuth = createRequireAuth({
	accessTokenSecret: config.accessTokenSecret,
});

export const optionalAuth = createOptionalAuth({
	accessTokenSecret: config.accessTokenSecret,
});

export { requireRole };
