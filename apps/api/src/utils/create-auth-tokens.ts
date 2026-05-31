import { eq } from "drizzle-orm";
import { Response } from "express";
import * as jwt from "jsonwebtoken";

import config from "@api/config";
import { db } from "@api/db";
import { User, users } from "@api/db/schema";
import { __prod__ } from "@api/lib/constants";
import { ApiError } from "@api/lib/errors";

export type RefreshTokenData = {
	userId: string;
	refreshTokenVersion?: number;
};

export type AccessTokenData = {
	userId: string;
};

// __prod__ is a boolean that is true when the NODE_ENV is "production"
const cookieOpts = {
	httpOnly: true,
	secure: __prod__,
	sameSite: "lax",
	path: "/",
	domain: __prod__ ? `.${config.domain}` : "",
	maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 year
} as const;

export const createAuthTokens = (
	user: User,
): { refreshToken: string; accessToken: string } => {
	const refreshToken = jwt.sign(
		{ userId: user.id, refreshTokenVersion: user.refreshTokenVersion },
		config.refreshTokenSecret,
		{
			expiresIn: "30d",
		},
	);

	const accessToken = jwt.sign(
		{ userId: user.id },
		config.accessTokenSecret,
		{
			expiresIn: "15min",
		},
	);

	return { refreshToken, accessToken };
};

export const sendAuthCookies = (res: Response, user: User) => {
	const { accessToken, refreshToken } = createAuthTokens(user);
	res.cookie("id", accessToken, cookieOpts);
	res.cookie("rid", refreshToken, cookieOpts);
};

export const clearAuthCookies = (res: Response) => {
	res.clearCookie("id", cookieOpts);
	res.clearCookie("rid", cookieOpts);
};

export const checkTokens = async (
	accessToken: string,
	refreshToken: string,
) => {
	try {
		// verify
		const data = <AccessTokenData>(
			jwt.verify(accessToken, config.accessTokenSecret)
		);

		// get userId from token data
		return {
			userId: data.userId,
		};
	} catch {
		// token is expired or signed with a different secret
		// so now check refresh token
	}

	if (!refreshToken) {
		throw new ApiError({ code: "UNAUTHORIZED" });
	}

	// 1. verify refresh token
	let data;
	try {
		data = <RefreshTokenData>(
			jwt.verify(refreshToken, config.refreshTokenSecret)
		);
	} catch {
		throw new ApiError({ code: "UNAUTHORIZED" });
	}

	// 2. get user
	const user = await db.query.users.findFirst({
		where: eq(users.id, data.userId),
	});

	// 3.check refresh token version
	if (!user || user.refreshTokenVersion !== data.refreshTokenVersion) {
		throw new ApiError({ code: "UNAUTHORIZED" });
	}

	return {
		userId: data.userId,
		user,
	};
};
