import { z } from "zod";

const toEmail = z.string().trim().email();

/** OTP-style payload shared by email verification and password reset. */
export const otpNotificationSchema = z.object({
	to: toEmail,
	code: z.string().regex(/^\d{4,8}$/, "Code must be 4-8 digits"),
	displayName: z.string().optional(),
	ttlMinutes: z.coerce.number().int().positive().optional(),
});

export const passwordResetNotificationSchema = otpNotificationSchema;

/** Generic transactional email (heading + body paragraphs). */
export const genericEmailSchema = z.object({
	to: toEmail,
	subject: z.string().min(1).max(200),
	heading: z.string().max(120).optional(),
	body: z.string().min(1),
	displayName: z.string().optional(),
});

export const inspectionScheduledSchema = z.object({
	to: toEmail,
	displayName: z.string().optional(),
	extinguisherSerial: z.string().min(1),
	location: z.string().optional(),
	date: z.string().min(1),
	time: z.string().optional(),
});

export const maintenanceLoggedSchema = z.object({
	to: toEmail,
	displayName: z.string().optional(),
	extinguisherSerial: z.string().min(1),
	actionTaken: z.string().min(1),
	date: z.string().min(1),
	notes: z.string().optional(),
});

export const expiryAlertSchema = z.object({
	to: toEmail,
	displayName: z.string().optional(),
	extinguisherSerial: z.string().min(1),
	location: z.string().optional(),
	expiryDate: z.string().min(1),
	daysRemaining: z.coerce.number().int().optional(),
});
