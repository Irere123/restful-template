import { asyncHandler } from "@repo/core";
import type { NextFunction, Request, Response } from "express";

import { checkTokens, setTokenCookies } from "@auth/utils/tokens";

const readTokens = (req: Request) => ({
	accessToken: (req.cookies?.id as string | undefined) ?? "",
	refreshToken: (req.cookies?.rid as string | undefined) ?? "",
});

/**
 * Require a valid session for the auth service's own routes. Unlike the
 * stateless guard other services use, this is DB-aware: it transparently
 * rotates tokens when the access token has expired but the refresh token is
 * still valid (sliding sessions), and can attach the full `req.user` record.
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

export { requireRole } from "@repo/core";
