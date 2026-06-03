/**
 * Client-side form schemas. These mirror the backend Zod rules so users get
 * instant feedback; the server remains the source of truth and re-validates.
 */

import { z } from "zod";

import {
	EXTINGUISHER_SIZES,
	EXTINGUISHER_STATUSES,
	EXTINGUISHER_TYPES,
	INSPECTION_RESULTS,
} from "@/lib/api/types";

export const emailSchema = z
	.string()
	.trim()
	.min(1, "Email is required")
	.email("Enter a valid email address");

export const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(128, "Password is too long");

export const nameSchema = z
	.string()
	.trim()
	.min(1, "Required")
	.max(50, "Must be 50 characters or fewer");

export const usernameSchema = z
	.string()
	.trim()
	.min(3, "Must be at least 3 characters")
	.max(30, "Must be 30 characters or fewer")
	.regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only");

export const otpSchema = z
	.string()
	.trim()
	.regex(/^\d{6}$/, "Enter the 6-digit code");

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date");

const timeString = z
	.string()
	.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM")
	.optional()
	.or(z.literal(""));

// ── Auth forms ──────────────────────────────────────────────────────────────

export const loginFormSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "Password is required"),
});

export const registerFormSchema = z.object({
	firstName: nameSchema,
	lastName: nameSchema,
	email: emailSchema,
	password: passwordSchema,
});

export const createManagedUserFormSchema = z.object({
	firstName: nameSchema,
	lastName: nameSchema,
	email: emailSchema,
	role: z.enum(["user", "inspector", "admin"]),
});

export const forgotPasswordFormSchema = z.object({
	email: emailSchema,
});

export const resetPasswordFormSchema = z.object({
	email: emailSchema,
	code: otpSchema,
	newPassword: passwordSchema,
});

export const changePasswordFormSchema = z
	.object({
		currentPassword: z.string().min(1, "Enter your current password"),
		newPassword: passwordSchema,
		confirmPassword: z.string().min(1, "Confirm your new password"),
	})
	.refine((v) => v.newPassword === v.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const profileFormSchema = z.object({
	firstName: nameSchema,
	lastName: nameSchema,
	username: z.union([usernameSchema, z.literal("")]).optional(),
});

// ── Management forms ────────────────────────────────────────────────────────

export const extinguisherFormSchema = z
	.object({
		serialNumber: z.string().trim().min(1, "Required").max(100),
		location: z.string().trim().min(1, "Required").max(200),
		type: z.enum(EXTINGUISHER_TYPES),
		size: z.enum(EXTINGUISHER_SIZES),
		installationDate: dateString,
		expiryDate: dateString,
		status: z.enum(EXTINGUISHER_STATUSES).optional(),
	})
	.refine((v) => v.expiryDate >= v.installationDate, {
		message: "Expiry must be on or after the installation date",
		path: ["expiryDate"],
	});

export const scheduleInspectionFormSchema = z.object({
	extinguisherId: z.string().min(1, "Select an extinguisher"),
	scheduledDate: dateString,
	scheduledTime: timeString,
	notes: z.string().max(2000).optional(),
});

export const completeInspectionFormSchema = z.object({
	result: z.enum(INSPECTION_RESULTS),
	notes: z.string().max(2000).optional(),
});

export const maintenanceFormSchema = z.object({
	extinguisherId: z.string().min(1, "Select an extinguisher"),
	actionTaken: z.string().trim().min(1, "Describe the action taken").max(500),
	maintenanceDate: dateString,
	issuesIdentified: z.string().max(2000).optional(),
	notes: z.string().max(2000).optional(),
	updateStatus: z.enum(EXTINGUISHER_STATUSES).optional(),
});

/**
 * Validate `values` against a schema. Returns either parsed data or a flat
 * `{ field: message }` map suitable for rendering inline field errors.
 */
export function validate<T>(
	schema: z.ZodType<T>,
	values: unknown,
): { ok: true; data: T } | { ok: false; errors: Record<string, string> } {
	const result = schema.safeParse(values);
	if (result.success) return { ok: true, data: result.data };
	const errors: Record<string, string> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[issue.path.length - 1];
		if (key != null && errors[String(key)] === undefined) {
			errors[String(key)] = issue.message;
		}
	}
	return { ok: false, errors };
}
