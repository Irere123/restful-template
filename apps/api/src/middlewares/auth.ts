import type { NextFunction, Request, Response } from "express";

import type { UserRole } from "@api/db/schema";
import { ApiError } from "@api/lib/errors";
import { checkTokens, setTokenCookies } from "@api/utils/create-auth-tokens";
import { asyncHandler } from "./async-handler";

const readTokens = (req: Request) => ({
	accessToken: (req.cookies?.id as string | undefined) ?? "",
	refreshToken: (req.cookies?.rid as string | undefined) ?? "",
});

/**
 * Require a valid session. Populates `req.userId`, `req.userRole` and
 * (when refreshed) `req.user`. Transparently rotates tokens when the access
 * token has expired but the refresh token is still valid.
 *
 * @throws {ApiError} UNAUTHORIZED when the request is not authenticated.
 */
export const requireAuth = asyncHandler(
	async (req: Request, res: Response, next: NextFunction) => {
		const { accessToken, refreshToken } = readTokens(req);
		const result = await checkTokens(accessToken, refreshToken);

		if (result.newTokens) {
			setTokenCookies(res, result.newTokens);
		}

		req.userId = result.userId;
		req.userRole = result.role;
		req.user = result.user;

		next();
	},
);

/**
 * Attach the principal if a valid session exists, but never reject. Useful for
 * endpoints that behave differently for authenticated vs anonymous callers.
 */
export const optionalAuth = asyncHandler(
	async (req: Request, res: Response, next: NextFunction) => {
		const { accessToken, refreshToken } = readTokens(req);
		if (!accessToken && !refreshToken) {
			return next();
		}

		try {
			const result = await checkTokens(accessToken, refreshToken);
			if (result.newTokens) {
				setTokenCookies(res, result.newTokens);
			}
			req.userId = result.userId;
			req.userRole = result.role;
			req.user = result.user;
		} catch {
			// Ignore invalid credentials — treat the caller as anonymous.
		}

		next();
	},
);

/**
 * Restrict a route to one of the given roles. Must run after {@link requireAuth}.
 *
 * @throws {ApiError} FORBIDDEN when the caller lacks a permitted role.
 */
export const requireRole =
	(...roles: UserRole[]) =>
	(req: Request, _res: Response, next: NextFunction) => {
		if (!req.userRole) {
			throw new ApiError({ code: "UNAUTHORIZED" });
		}
		if (!roles.includes(req.userRole)) {
			throw new ApiError({
				code: "FORBIDDEN",
				message: "You do not have permission to perform this action",
			});
		}
		next();
	};
