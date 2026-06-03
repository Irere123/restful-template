import {
	createUser,
	deleteUser,
	getUserByEmail,
	getUserById,
	getUserByUsername,
	revokeRefreshTokens,
	type UpdateUserInput,
	updateUser,
} from "@auth/db/queries";
import {
	confirmEmailVerification,
	issueEmailVerification,
} from "@auth/lib/email-verification";
import {
	sendAccountDeletedEmail,
	sendLoginAlert,
	sendLogoutAlert,
	sendWelcomeEmail,
} from "@auth/lib/notifications";
import { hashPassword, verifyPassword } from "@auth/lib/password";
import {
	consumePasswordResetCode,
	issuePasswordReset,
} from "@auth/lib/password-reset";
import logger from "@auth/logger";
import { optionalAuth, requireAuth } from "@auth/middleware/auth";
import {
	changePasswordSchema,
	forgotPasswordSchema,
	loginSchema,
	registerSchema,
	resetPasswordSchema,
	updateProfileSchema,
	verifyEmailSchema,
} from "@auth/schemas/auth";
import { parse } from "@auth/utils/parse";
import { sanitizeUser } from "@auth/utils/sanitize-user";
import {
	checkTokens,
	clearAuthCookies,
	createAuthTokens,
	sendAuthCookies,
	setTokenCookies,
} from "@auth/utils/tokens";
import {
	ApiError,
	asyncHandler,
	createAuthRateLimiter,
	generateId,
} from "@repo/core";
import { Router } from "express";

/** Best-effort request metadata for security (sign-in/out) alert emails. */
const getClientContext = (req: {
	ip?: string;
	headers: Record<string, unknown>;
}) => {
	const forwarded = req.headers["x-forwarded-for"];
	const ipAddress =
		(typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : "") ||
		req.ip ||
		undefined;
	const ua = req.headers["user-agent"];
	return {
		time: new Date().toISOString(),
		ipAddress,
		userAgent: typeof ua === "string" ? ua : undefined,
	};
};

export const createAuthRouter = (): Router => {
	const router = Router();
	const authRateLimiter = createAuthRateLimiter();

	router.post(
		"/register",
		authRateLimiter,
		asyncHandler(async (req, res) => {
			const { firstName, lastName, email, password } = parse(
				registerSchema,
				req.body,
			);

			if (await getUserByEmail(email)) {
				throw new ApiError({
					code: "CONFLICT",
					message: "An account with this email already exists",
				});
			}

			const user = await createUser({
				id: await generateId(),
				email,
				password: await hashPassword(password),
				firstName,
				lastName,
				displayName: `${firstName} ${lastName}`,
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
			// Greet the new user (separate from the verification code email above).
			sendWelcomeEmail(user.email, user.displayName);
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
			// Security alert: notify the owner of a new sign-in.
			sendLoginAlert(user.email, user.displayName, getClientContext(req));
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

			// Keep the denormalized full name in sync when either part changes.
			const named: UpdateUserInput = { ...updates };
			if (updates.firstName !== undefined || updates.lastName !== undefined) {
				const current = req.user ?? (await getUserById(req.userId!));
				if (!current) {
					throw new ApiError({ code: "UNAUTHORIZED" });
				}
				const firstName = updates.firstName ?? current.firstName;
				const lastName = updates.lastName ?? current.lastName;
				named.displayName = `${firstName} ${lastName}`;
			}

			const user = await updateUser(req.userId!, named);
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

	router.post(
		"/forgot-password",
		authRateLimiter,
		asyncHandler(async (req, res) => {
			const { email } = parse(forgotPasswordSchema, req.body);

			const user = await getUserByEmail(email);
			// Always respond success — never reveal whether an email is registered.
			if (user) {
				try {
					await issuePasswordReset(user);
				} catch (err) {
					logger.error("Failed to send password reset email", {
						userId: user.id,
						error: err instanceof Error ? err.message : String(err),
					});
				}
			}

			res.json({ success: true });
		}),
	);

	router.post(
		"/reset-password",
		authRateLimiter,
		asyncHandler(async (req, res) => {
			const { email, code, newPassword } = parse(resetPasswordSchema, req.body);

			const user = await getUserByEmail(email);
			if (!user) {
				throw new ApiError({
					code: "BAD_REQUEST",
					message: "Invalid or expired reset code",
				});
			}

			await consumePasswordResetCode(user, code);

			await updateUser(user.id, { password: await hashPassword(newPassword) });
			// Revoke every session — a reset should log out all devices.
			await revokeRefreshTokens(user.id);
			clearAuthCookies(res);

			res.json({ success: true });
		}),
	);

	router.post(
		"/logout",
		// Optional auth so we can address the sign-out confirmation to the user,
		// but logging out must succeed even without a valid session.
		optionalAuth,
		asyncHandler(async (req, res) => {
			clearAuthCookies(res);
			const user =
				req.user ?? (req.userId ? await getUserById(req.userId) : undefined);
			if (user) {
				sendLogoutAlert(user.email, user.displayName, {
					time: new Date().toISOString(),
				});
			}
			res.json({ success: true });
		}),
	);

	router.post(
		"/logout-all",
		requireAuth,
		asyncHandler(async (req, res) => {
			await revokeRefreshTokens(req.userId!);
			clearAuthCookies(res);
			const user =
				req.user ?? (req.userId ? await getUserById(req.userId) : undefined);
			if (user) {
				sendLogoutAlert(user.email, user.displayName, {
					allDevices: true,
					time: new Date().toISOString(),
				});
			}
			res.json({ success: true });
		}),
	);

	router.delete(
		"/me",
		requireAuth,
		asyncHandler(async (req, res) => {
			const user = req.user ?? (await getUserById(req.userId!));
			if (!user) {
				throw new ApiError({ code: "UNAUTHORIZED" });
			}

			const deleted = await deleteUser(user.id);
			if (!deleted) {
				throw new ApiError({ code: "NOT_FOUND", message: "User not found" });
			}
			clearAuthCookies(res);
			sendAccountDeletedEmail(user.email, user.displayName, false);
			res.json({ success: true });
		}),
	);

	return router;
};
