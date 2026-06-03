import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { ApiError } from "../errors";
import type { AccessTokenPayload, UserRole } from "../types";

export interface AuthMiddlewareOptions {
	accessTokenSecret: string;
}

/**
 * Read the access token from either the httpOnly `id` cookie (browser clients)
 * or an `Authorization: Bearer <token>` header (service/API clients).
 */
const readAccessToken = (req: Request): string => {
	const fromCookie = req.cookies?.id as string | undefined;
	if (fromCookie) return fromCookie;

	const auth = req.headers.authorization;
	if (auth?.startsWith("Bearer ")) return auth.slice(7);

	return "";
};

const verify = (token: string, secret: string): AccessTokenPayload => {
	return jwt.verify(token, secret) as AccessTokenPayload;
};

/**
 * Require a valid access token. Stateless — every service verifies the JWT with
 * the shared secret, no database round-trip and no dependency on the auth
 * service at request time. Populates `req.userId`, `req.userRole`, `req.userEmail`.
 *
 * Token refresh lives only in the auth service (it owns the user table), so an
 * expired token here is a hard 401; the client refreshes and retries.
 *
 * @throws {ApiError} UNAUTHORIZED when the request is not authenticated.
 */
export const createRequireAuth =
	({ accessTokenSecret }: AuthMiddlewareOptions) =>
	(req: Request, _res: Response, next: NextFunction): void => {
		const token = readAccessToken(req);
		if (!token) {
			throw new ApiError({ code: "UNAUTHORIZED" });
		}
		try {
			const payload = verify(token, accessTokenSecret);
			req.userId = payload.userId;
			req.userRole = payload.role;
			req.userEmail = payload.email;
			next();
		} catch {
			throw new ApiError({
				code: "UNAUTHORIZED",
				message: "Invalid or expired session",
			});
		}
	};

/**
 * Attach the principal if a valid token exists, but never reject. Useful for
 * endpoints that behave differently for authenticated vs anonymous callers.
 */
export const createOptionalAuth =
	({ accessTokenSecret }: AuthMiddlewareOptions) =>
	(req: Request, _res: Response, next: NextFunction): void => {
		const token = readAccessToken(req);
		if (token) {
			try {
				const payload = verify(token, accessTokenSecret);
				req.userId = payload.userId;
				req.userRole = payload.role;
				req.userEmail = payload.email;
			} catch {
				// Ignore invalid credentials — treat the caller as anonymous.
			}
		}
		next();
	};

/**
 * Restrict a route to one of the given roles. Must run after the auth
 * middleware that populates `req.userRole`.
 *
 * @throws {ApiError} FORBIDDEN when the caller lacks a permitted role.
 */
export const requireRole =
	(...roles: UserRole[]) =>
	(req: Request, _res: Response, next: NextFunction): void => {
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

/**
 * Guard an internal-only endpoint (e.g. the notification send API) with the
 * shared internal key, so only trusted services — never public clients — can
 * reach it.
 *
 * @throws {ApiError} UNAUTHORIZED when the key is missing or wrong.
 */
export const createRequireInternal =
	(internalKey: string) =>
	(req: Request, _res: Response, next: NextFunction): void => {
		const provided = req.headers["x-internal-key"];
		if (!provided || provided !== internalKey) {
			throw new ApiError({
				code: "UNAUTHORIZED",
				message: "Missing or invalid internal key",
			});
		}
		next();
	};
