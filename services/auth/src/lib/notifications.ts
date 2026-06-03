import config from "@auth/config";
import { OTP_TTL_MINUTES } from "@auth/lib/otp";
import logger from "@auth/logger";
import { serviceRequest } from "@repo/core";

/**
 * Thin client over the notification service. All outbound email is owned by
 * that service; auth only hands it the recipient + payload over a trusted,
 * internal-key-authenticated call.
 */

export const sendOtpEmail = async (
	to: string,
	code: string,
	displayName: string,
): Promise<void> => {
	await serviceRequest(`${config.notificationUrl}/notifications/otp`, {
		method: "POST",
		internalKey: config.internalApiKey,
		body: { to, code, displayName, ttlMinutes: OTP_TTL_MINUTES },
	});
};

export const sendPasswordResetEmail = async (
	to: string,
	code: string,
	displayName: string,
): Promise<void> => {
	await serviceRequest(
		`${config.notificationUrl}/notifications/password-reset`,
		{
			method: "POST",
			internalKey: config.internalApiKey,
			body: { to, code, displayName, ttlMinutes: OTP_TTL_MINUTES },
		},
	);
};

/**
 * Fire-and-forget post to a notification endpoint. Lifecycle emails (welcome,
 * sign-in/out, account deleted) must never block or fail the auth flow that
 * triggered them, so failures are swallowed and logged.
 */
const notify = (path: string, body: Record<string, unknown>): void => {
	void serviceRequest(`${config.notificationUrl}/notifications/${path}`, {
		method: "POST",
		internalKey: config.internalApiKey,
		body,
	}).catch((err) => {
		logger.error(`Failed to send ${path} notification`, {
			error: err instanceof Error ? err.message : String(err),
		});
	});
};

/** Welcome email on registration. */
export const sendWelcomeEmail = (to: string, displayName: string): void => {
	notify("welcome", { to, displayName });
};

export type LoginAlertContext = {
	time?: string;
	ipAddress?: string;
	userAgent?: string;
};

/** Security alert on a new sign-in (gated by SECURITY_ALERTS_ENABLED). */
export const sendLoginAlert = (
	to: string,
	displayName: string,
	context: LoginAlertContext = {},
): void => {
	if (!config.securityAlertsEnabled) return;
	notify("login-alert", { to, displayName, ...context });
};

/** Confirmation on sign-out (gated by SECURITY_ALERTS_ENABLED). */
export const sendLogoutAlert = (
	to: string,
	displayName: string,
	options: { allDevices?: boolean; time?: string } = {},
): void => {
	if (!config.securityAlertsEnabled) return;
	notify("logout-alert", { to, displayName, ...options });
};

/** Confirmation that an account was permanently deleted. */
export const sendAccountDeletedEmail = (
	to: string,
	displayName: string,
	byAdmin = false,
): void => {
	notify("account-deleted", { to, displayName, byAdmin });
};
