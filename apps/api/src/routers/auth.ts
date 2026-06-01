import { Router } from "express";
import { z } from "zod";

import {
	createUser,
	getUserByEmail,
	getUserById,
	getUserByUsername,
	revokeRefreshTokens,
	updateUser,
} from "@api/db/queries";
import {
	confirmEmailVerification,
	issueEmailVerification,
} from "@api/lib/email-verification";
import { ApiError } from "@api/lib/errors";
import { hashPassword, verifyPassword } from "@api/lib/password";
import { asyncHandler, authRateLimiter, requireAuth } from "@api/middlewares";
import {
	changePasswordSchema,
	loginSchema,
	registerSchema,
	updateProfileSchema,
	verifyEmailSchema,
} from "@api/schemas/auth";
import {
	checkTokens,
	clearAuthCookies,
	createAuthTokens,
	sendAuthCookies,
	setTokenCookies,
} from "@api/utils/create-auth-tokens";
import { generateId } from "@api/utils/generate-id";
import logger from "@api/utils/logger";
import { sanitizeUser } from "@api/utils/sanitize-user";

/** Parse a request body with a zod schema, throwing a BAD_REQUEST ApiError. */
const parse = <T>(schema: z.ZodType<T>, body: unknown): T => {
	const result = schema.safeParse(body);
	if (!result.success) {
		throw new ApiError({
			code: "BAD_REQUEST",
			message: "Invalid request body",
			details: result.error.issues,
		});
	}
	return result.data;
};

export const createAuthRouter = (): Router => {
	const router = Router();

	router.post(
		"/register",
		authRateLimiter,
		asyncHandler(async (req, res) => {
			const { email, password, displayName, username } = parse(
				registerSchema,
				req.body,
			);

			if (await getUserByEmail(email)) {
				throw new ApiError({
					code: "CONFLICT",
					message: "An account with this email already exists",
				});
			}
			if (username && (await getUserByUsername(username))) {
				throw new ApiError({
					code: "CONFLICT",
					message: "This username is already taken",
				});
			}

			const user = await createUser({
				id: await generateId(),
				email,
				password: await hashPassword(password),
				displayName,
				username: username ?? null,
			});

			// Kick off email verification. Don't fail registration if the email
			// can't be sent — the account exists and the user can request a resend.
			try {
				await issueEmailVerification(user);
			} catch (err) {
				logger.error("Failed to send verification email on register", {
					userId: user.id,
					error: err instanceof Error ? err.message : String(err),
				});
			}

			sendAuthCookies(res, user);
			res.status(201).json({ user: sanitizeUser(user) });
		}),
	);

	router.post(
		"/verify-email",
		requireAuth,
		authRateLimiter,
		asyncHandler(async (req, res) => {
			const { code } = parse(verifyEmailSchema, req.body);

			const user = req.user ?? (await getUserById(req.userId!));
			if (!user) {
				throw new ApiError({ code: "UNAUTHORIZED" });
			}

			await confirmEmailVerification(user, code);

			const updated = (await getUserById(user.id)) ?? user;
			res.json({ user: sanitizeUser(updated) });
		}),
	);

	router.post(
		"/verify-email/resend",
		requireAuth,
		authRateLimiter,
		asyncHandler(async (req, res) => {
			const user = req.user ?? (await getUserById(req.userId!));
			if (!user) {
				throw new ApiError({ code: "UNAUTHORIZED" });
			}

			if (user.emailVerified) {
				throw new ApiError({
					code: "CONFLICT",
					message: "Email is already verified",
				});
			}

			await issueEmailVerification(user);
			res.json({ success: true });
		}),
	);

	router.post(
		"/login",
		authRateLimiter,
		asyncHandler(async (req, res) => {
			const { email, password } = parse(loginSchema, req.body);

			const user = await getUserByEmail(email);
			// Hash-compare even when the user is missing so login timing doesn't
			// reveal which emails are registered.
			const passwordOk = user
				? await verifyPassword(password, user.password)
				: await verifyPassword(
						password,
						"$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinv",
					);

			if (!user || !passwordOk) {
				throw new ApiError({
					code: "UNAUTHORIZED",
					message: "Invalid email or password",
				});
			}

			sendAuthCookies(res, user);
			res.json({ user: sanitizeUser(user) });
		}),
	);

	router.post(
		"/refresh",
		asyncHandler(async (req, res) => {
			const refreshToken = (req.cookies?.rid as string | undefined) ?? "";
			if (!refreshToken) {
				throw new ApiError({ code: "UNAUTHORIZED" });
			}

			// Empty access token forces checkTokens down the refresh path.
			const result = await checkTokens("", refreshToken);

			if (result.newTokens) {
				setTokenCookies(res, result.newTokens);
			}
			res.json({ user: result.user ? sanitizeUser(result.user) : null });
		}),
	);

	router.get(
		"/me",
		requireAuth,
		asyncHandler(async (req, res) => {
			const user = req.user ?? (await getUserById(req.userId!));
			if (!user) {
				throw new ApiError({ code: "UNAUTHORIZED" });
			}
			res.json({ user: sanitizeUser(user) });
		}),
	);

	router.patch(
		"/me",
		requireAuth,
		asyncHandler(async (req, res) => {
			const updates = parse(updateProfileSchema, req.body);

			if (updates.username) {
				const existing = await getUserByUsername(updates.username);
				if (existing && existing.id !== req.userId) {
					throw new ApiError({
						code: "CONFLICT",
						message: "This username is already taken",
					});
				}
			}

			const user = await updateUser(req.userId!, updates);
			if (!user) {
				throw new ApiError({ code: "NOT_FOUND", message: "User not found" });
			}
			res.json({ user: sanitizeUser(user) });
		}),
	);

	router.post(
		"/change-password",
		requireAuth,
		asyncHandler(async (req, res) => {
			const { currentPassword, newPassword } = parse(
				changePasswordSchema,
				req.body,
			);

			const user = req.user ?? (await getUserById(req.userId!));
			if (!user) {
				throw new ApiError({ code: "UNAUTHORIZED" });
			}

			if (!(await verifyPassword(currentPassword, user.password))) {
				throw new ApiError({
					code: "UNAUTHORIZED",
					message: "Current password is incorrect",
				});
			}

			await updateUser(user.id, { password: await hashPassword(newPassword) });
			// Invalidate all existing refresh tokens, then re-issue for this client.
			await revokeRefreshTokens(user.id);
			const refreshed = await getUserById(user.id);
			if (refreshed) {
				setTokenCookies(res, createAuthTokens(refreshed));
			}

			res.json({ success: true });
		}),
	);

	router.post("/logout", (_req, res) => {
		clearAuthCookies(res);
		res.json({ success: true });
	});

	router.post(
		"/logout-all",
		requireAuth,
		asyncHandler(async (req, res) => {
			await revokeRefreshTokens(req.userId!);
			clearAuthCookies(res);
			res.json({ success: true });
		}),
	);

	return router;
};
