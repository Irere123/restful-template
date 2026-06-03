import config from "@auth/config";
import { getUserById } from "@auth/db/queries";
import type { User } from "@auth/db/schema";
import type {
	AccessTokenPayload,
	RefreshTokenPayload,
	UserRole,
} from "@repo/core";
import { ApiError } from "@repo/core";
import type { CookieOptions, Response } from "express";
import * as jwt from "jsonwebtoken";

export type AuthTokens = {
	accessToken: string;
	refreshToken: string;
};

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

const cookieOpts: CookieOptions = {
	httpOnly: true,
	secure: config.isProduction,
	sameSite: "lax",
	path: "/",
	// Only scope to a parent domain in production; in dev let the browser use the
	// request host (an empty/invalid domain breaks cookies on localhost).
	...(config.isProduction && config.domain
		? { domain: `.${config.domain}` }
		: {}),
	maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days, matches the refresh token
};

export const createAuthTokens = (user: User): AuthTokens => {
	const refreshPayload: RefreshTokenPayload = {
		userId: user.id,
		refreshTokenVersion: user.refreshTokenVersion,
	};
	const accessPayload: AccessTokenPayload = {
		userId: user.id,
		role: user.role,
		email: user.email,
	};

	const refreshToken = jwt.sign(refreshPayload, config.refreshTokenSecret, {
		expiresIn: REFRESH_TOKEN_TTL,
	});
	const accessToken = jwt.sign(accessPayload, config.accessTokenSecret, {
		expiresIn: ACCESS_TOKEN_TTL,
	});

	return { refreshToken, accessToken };
};

/** Write existing tokens to the response cookies. */
export const setTokenCookies = (res: Response, tokens: AuthTokens): void => {
	res.cookie("id", tokens.accessToken, cookieOpts);
	res.cookie("rid", tokens.refreshToken, cookieOpts);
};

/** Issue a fresh token pair for a user and write them to the response cookies. */
export const sendAuthCookies = (res: Response, user: User): void => {
	setTokenCookies(res, createAuthTokens(user));
};

export const clearAuthCookies = (res: Response): void => {
	res.clearCookie("id", cookieOpts);
	res.clearCookie("rid", cookieOpts);
};

export type CheckTokensResult = {
	userId: string;
	role: UserRole;
	/** Present only when the access token was refreshed via the refresh token. */
	user?: User;
	/** Present only when a new token pair was issued and should be re-sent. */
	newTokens?: AuthTokens;
};

/**
 * Validate the access token; if it is missing/expired, fall back to the refresh
 * token and transparently mint a new token pair (sliding sessions). This
 * DB-aware refresh lives only in the auth service, which owns the user table.
 *
 * @throws {ApiError} UNAUTHORIZED when neither token can authenticate the request.
 */
export const checkTokens = async (
	accessToken: string,
	refreshToken: string,
): Promise<CheckTokensResult> => {
	// Fast path: a valid access token needs no database round-trip.
	if (accessToken) {
		try {
			const data = jwt.verify(
				accessToken,
				config.accessTokenSecret,
			) as AccessTokenPayload;
			return { userId: data.userId, role: data.role };
		} catch {
			// Expired or invalid — fall through to the refresh token.
		}
	}

	if (!refreshToken) {
		throw new ApiError({ code: "UNAUTHORIZED" });
	}

	let data: RefreshTokenPayload;
	try {
		data = jwt.verify(
			refreshToken,
			config.refreshTokenSecret,
		) as RefreshTokenPayload;
	} catch {
		throw new ApiError({ code: "UNAUTHORIZED" });
	}

	const user = await getUserById(data.userId);

	// Reject if the user is gone or the refresh token has been revoked
	// (refreshTokenVersion is bumped on logout-all / password change/reset).
	if (!user || user.refreshTokenVersion !== data.refreshTokenVersion) {
		throw new ApiError({ code: "UNAUTHORIZED" });
	}

	const newTokens = createAuthTokens(user);

	return { userId: user.id, role: user.role, user, newTokens };
};
