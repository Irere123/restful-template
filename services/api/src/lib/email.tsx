import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";

import config from "@api/config";
import { OtpVerificationEmail } from "@api/emails/otp-verification";
import { ApiError } from "@api/lib/errors";
import { OTP_TTL_MINUTES } from "@api/lib/otp";
import logger from "@api/utils/logger";

// Instantiated only when a key is configured. In development this is typically
// null, so emails are logged instead of sent (see sendEmail).
const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

export type SendEmailInput = {
	to: string;
	subject: string;
	template: ReactElement;
};

/**
 * Render a React Email template and deliver it via Resend.
 *
 * When no RESEND_API_KEY is configured (local dev), the email is not sent —
 * the subject/recipient are logged instead so flows can be exercised without
 * a real provider. In production a missing key is a config error caught at
 * startup, so this path only happens in development.
 */
export const sendEmail = async ({
	to,
	subject,
	template,
}: SendEmailInput): Promise<void> => {
	const html = await render(template);

	if (!resend) {
		logger.warn("RESEND_API_KEY not set — email not sent", { to, subject });
		return;
	}

	const { error } = await resend.emails.send({
		from: config.emailFrom,
		to,
		subject,
		html,
	});

	if (error) {
		logger.error("Failed to send email", { to, subject, error });
		throw new ApiError({
			code: "BAD_GATEWAY",
			message: "Failed to send email",
			cause: error,
		});
	}
};

/** Send a one-time verification code to a recipient's email address. */
export const sendOtpEmail = async (to: string, code: string): Promise<void> => {
	// In dev (no provider) surface the code so it can be used directly.
	if (!resend) {
		logger.info("OTP verification code (dev only)", { to, code });
	}

	await sendEmail({
		to,
		subject: `${code} is your ${config.appName} verification code`,
		template: (
			<OtpVerificationEmail
				code={code}
				appName={config.appName}
				ttlMinutes={OTP_TTL_MINUTES}
			/>
		),
	});
};
