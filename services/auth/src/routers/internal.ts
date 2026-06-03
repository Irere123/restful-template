import config from "@auth/config";
import { listUsersByRoles } from "@auth/db/queries";
import {
	asyncHandler,
	createRequireInternal,
	USER_ROLES,
	type UserRole,
} from "@repo/core";
import { Router } from "express";

/**
 * Internal-only API for trusted services. Guarded by the shared internal key
 * (never exposed through the public gateway). Lets other services — e.g. the
 * management cron jobs — resolve the email recipients for compliance alerts
 * without owning the user table.
 */
export const createInternalRouter = (): Router => {
	const router = Router();

	router.use(createRequireInternal(config.internalApiKey));

	// GET /internal/users?roles=admin,inspector — directory lookup by role.
	router.get(
		"/users",
		asyncHandler(async (req, res) => {
			const raw = typeof req.query.roles === "string" ? req.query.roles : "";
			const requested = raw
				.split(",")
				.map((r) => r.trim())
				.filter(Boolean);
			const roles = (
				requested.length ? requested : [...USER_ROLES]
			).filter((r): r is UserRole =>
				(USER_ROLES as readonly string[]).includes(r),
			);

			const users = await listUsersByRoles(roles);
			res.json({
				users: users.map((u) => ({
					id: u.id,
					email: u.email,
					displayName: u.displayName,
					role: u.role,
				})),
			});
		}),
	);

	return router;
};
