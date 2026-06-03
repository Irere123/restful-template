import { Router } from "express";

import { getUserById, listUsers } from "@api/db/queries";
import { ApiError } from "@api/lib/errors";
import { asyncHandler, requireAuth, requireRole } from "@api/middlewares";
import { sanitizeUser } from "@api/utils/sanitize-user";

/**
 * User management routes. Every route requires authentication; management
 * actions additionally require the `admin` role (RBAC demonstration).
 */
export const createUsersRouter = (): Router => {
	const router = Router();

	router.use(requireAuth);

	router.get(
		"/",
		requireRole("admin"),
		asyncHandler(async (_req, res) => {
			const all = await listUsers();
			res.json({ users: all.map(sanitizeUser) });
		}),
	);

	router.get(
		"/:id",
		requireRole("admin"),
		asyncHandler(async (req, res) => {
			const id = req.params.id;
			if (typeof id !== "string") {
				throw new ApiError({ code: "BAD_REQUEST", message: "Invalid user id" });
			}
			const user = await getUserById(id);
			if (!user) {
				throw new ApiError({ code: "NOT_FOUND", message: "User not found" });
			}
			res.json({ user: sanitizeUser(user) });
		}),
	);

	return router;
};
