import { ApiError, asyncHandler } from "@repo/core";
import { Router } from "express";

import {
	deleteUser,
	getUserById,
	listUsers,
	revokeRefreshTokens,
	updateUser,
} from "@auth/db/queries";
import { requireAuth, requireRole } from "@auth/middleware/auth";
import { updateUserRoleSchema } from "@auth/schemas/auth";
import { parse } from "@auth/utils/parse";
import { sanitizeUser } from "@auth/utils/sanitize-user";

const getIdParam = (raw: string | undefined): string => {
	if (typeof raw !== "string" || raw.length === 0) {
		throw new ApiError({ code: "BAD_REQUEST", message: "Invalid user id" });
	}
	return raw;
};

/**
 * User-management routes (Admin only). Demonstrates RBAC: every route requires
 * authentication AND the `admin` role.
 */
export const createUsersRouter = (): Router => {
	const router = Router();

	router.use(requireAuth, requireRole("admin"));

	router.get(
		"/",
		asyncHandler(async (_req, res) => {
			const all = await listUsers();
			res.json({ users: all.map(sanitizeUser) });
		}),
	);

	router.get(
		"/:id",
		asyncHandler(async (req, res) => {
			const id = getIdParam(req.params.id);
			const user = await getUserById(id);
			if (!user) {
				throw new ApiError({ code: "NOT_FOUND", message: "User not found" });
			}
			res.json({ user: sanitizeUser(user) });
		}),
	);

	router.patch(
		"/:id/role",
		asyncHandler(async (req, res) => {
			const id = getIdParam(req.params.id);
			const { role } = parse(updateUserRoleSchema, req.body);

			const existing = await getUserById(id);
			if (!existing) {
				throw new ApiError({ code: "NOT_FOUND", message: "User not found" });
			}

			const user = await updateUser(id, { role });
			// Force the new role to take effect on the user's next token refresh.
			await revokeRefreshTokens(id);

			res.json({ user: sanitizeUser(user ?? existing) });
		}),
	);

	router.delete(
		"/:id",
		asyncHandler(async (req, res) => {
			const id = getIdParam(req.params.id);
			if (id === req.userId) {
				throw new ApiError({
					code: "BAD_REQUEST",
					message: "You cannot delete your own account",
				});
			}

			const deleted = await deleteUser(id);
			if (!deleted) {
				throw new ApiError({ code: "NOT_FOUND", message: "User not found" });
			}
			res.json({ success: true });
		}),
	);

	return router;
};
