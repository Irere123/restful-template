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

/** Welcome email sent right after registration. */
export const welcomeSchema = z.object({
	to: toEmail,
	displayName: z.string().optional(),
});

/** Security alert sent when a new sign-in is detected. */
export const loginAlertSchema = z.object({
	to: toEmail,
	displayName: z.string().optional(),
	time: z.string().optional(),
	ipAddress: z.string().optional(),
	userAgent: z.string().optional(),
});

/** Confirmation that a session (or all sessions) was signed out. */
export const logoutAlertSchema = z.object({
	to: toEmail,
	displayName: z.string().optional(),
	time: z.string().optional(),
	allDevices: z.coerce.boolean().optional(),
});

/** Confirmation that an account was permanently deleted. */
export const accountDeletedSchema = z.object({
	to: toEmail,
	displayName: z.string().optional(),
	byAdmin: z.coerce.boolean().optional(),
});

const expiryDigestItemSchema = z.object({
	serialNumber: z.string().min(1),
	location: z.string().optional(),
	expiryDate: z.string().min(1),
	daysRemaining: z.coerce.number().int().optional(),
});

/** Daily expiry digest produced by the management expiry-scan cron job. */
export const expiryDigestSchema = z.object({
	to: toEmail,
	displayName: z.string().optional(),
	expiringSoon: z.array(expiryDigestItemSchema).default([]),
	expired: z.array(expiryDigestItemSchema).default([]),
});

const inspectionReminderItemSchema = z.object({
	serialNumber: z.string().min(1),
	location: z.string().optional(),
	scheduledDate: z.string().min(1),
	scheduledTime: z.string().optional(),
});

/** Daily inspection reminder produced by the management reminder cron job. */
export const inspectionReminderSchema = z.object({
	to: toEmail,
	displayName: z.string().optional(),
	upcoming: z.array(inspectionReminderItemSchema).default([]),
	overdue: z.array(inspectionReminderItemSchema).default([]),
});
