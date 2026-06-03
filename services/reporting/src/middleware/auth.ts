import { createRequireAuth, requireRole } from "@repo/core";
import config from "@reporting/config";

/** Stateless JWT guard — verifies the access token with the shared secret. */
export const requireAuth = createRequireAuth({
	accessTokenSecret: config.accessTokenSecret,
});

export { requireRole };
