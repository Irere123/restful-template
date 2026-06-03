import { USER_ROLES } from "@repo/core";
import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(128);

export const usernameSchema = z
	.string()
	.trim()
	.min(3)
	.max(30)
	.regex(
		/^[a-zA-Z0-9_]+$/,
		"Username may only contain letters, numbers and underscores",
	);

export const displayNameSchema = z.string().trim().min(1).max(50);

/** A 6-digit numeric one-time code (email verification / password reset). */
export const otpSchema = z
	.string()
	.trim()
	.regex(/^\d{6}$/, "Code must be 6 digits");

export const registerSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	displayName: displayNameSchema,
	username: usernameSchema.optional(),
});

export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1),
});

export const updateProfileSchema = z
	.object({
		displayName: displayNameSchema.optional(),
		username: usernameSchema.optional(),
	})
	.refine((v) => Object.keys(v).length > 0, {
		message: "No fields to update",
	});

export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1),
	newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
	code: otpSchema,
});

export const forgotPasswordSchema = z.object({
	email: emailSchema,
});

export const resetPasswordSchema = z.object({
	email: emailSchema,
	code: otpSchema,
	newPassword: passwordSchema,
});

/** Admin-only: change a user's role. */
export const updateUserRoleSchema = z.object({
	role: z.enum(USER_ROLES),
});

/** Shape of a user as returned by the API (password hash stripped). */
export const publicUserSchema = z.object({
	id: z.string(),
	username: z.string().nullable(),
	displayName: z.string(),
	email: z.string(),
	role: z.enum(USER_ROLES),
	emailVerified: z.date().nullable(),
	refreshTokenVersion: z.number().int(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
