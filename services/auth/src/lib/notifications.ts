import config from "@auth/config";
import { OTP_TTL_MINUTES } from "@auth/lib/otp";
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
