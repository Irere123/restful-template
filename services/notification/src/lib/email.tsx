import config from "@notification/config";
import logger from "@notification/logger";
import { render } from "@react-email/render";
import { ApiError } from "@repo/core";
import type { ReactElement } from "react";
import { Resend } from "resend";

// Instantiated only when a key is configured. In development this is typically
// null, so emails are logged instead of sent (see sendEmail).
const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

/** Whether a real email provider is configured (false in local dev). */
export const emailEnabled = resend !== null;

export type SendEmailInput = {
	to: string;
	subject: string;
	template: ReactElement;
};

/**
 * Render a React Email template and deliver it via Resend.
 *
 * When no RESEND_API_KEY is configured (local dev) the email is not sent — the
 * subject/recipient are logged instead so flows can be exercised without a real
 * provider. In production a missing key is a config error caught at startup.
 *
 * @throws {ApiError} BAD_GATEWAY when the provider rejects the send.
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
