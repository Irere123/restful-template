import {
	asyncHandler,
	createRequireInternal,
	parse,
} from "@repo/core";
import { Router } from "express";
import type { ReactElement } from "react";

import { listNotifications, logNotification } from "@notification/db/queries";
import type { NotificationStatus } from "@notification/db/schema";
import { EmailLayout, paragraph } from "@notification/emails/layout";
import { ExpiryAlertEmail } from "@notification/emails/expiry-alert";
import { InspectionScheduledEmail } from "@notification/emails/inspection-scheduled";
import { MaintenanceLoggedEmail } from "@notification/emails/maintenance-logged";
import { OtpVerificationEmail } from "@notification/emails/otp-verification";
import { PasswordResetEmail } from "@notification/emails/password-reset";
import config from "@notification/config";
import { emailEnabled, sendEmail } from "@notification/lib/email";
import logger from "@notification/logger";
import {
	expiryAlertSchema,
	genericEmailSchema,
	inspectionScheduledSchema,
	maintenanceLoggedSchema,
	otpNotificationSchema,
	passwordResetNotificationSchema,
} from "@notification/schemas";
import { Text } from "@react-email/components";

interface DeliverInput {
	type: string;
	to: string;
	subject: string;
	template: ReactElement;
	metadata?: Record<string, unknown>;
}

/**
 * Render + send an email, recording the outcome to the audit log. Never throws
 * for a delivery failure — it returns the status so the caller decides the HTTP
 * response; this keeps the notification log complete even on provider errors.
 */
const deliver = async (input: DeliverInput): Promise<NotificationStatus> => {
	let status: NotificationStatus = emailEnabled ? "sent" : "skipped";
	let error: string | null = null;

	try {
		await sendEmail({
			to: input.to,
			subject: input.subject,
			template: input.template,
		});
	} catch (err) {
		status = "failed";
		error = err instanceof Error ? err.message : String(err);
	}

	await logNotification({
		type: input.type,
		recipient: input.to,
		subject: input.subject,
		status,
		error,
		metadata: input.metadata ?? null,
	});

	return status;
};

/**
 * Internal notification API. Every send endpoint is guarded by the shared
 * internal key — only trusted services (auth, management, reporting) reach it,
 * never public clients.
 */
export const createNotificationsRouter = (): Router => {
	const router = Router();

	router.use(createRequireInternal(config.internalApiKey));

	router.get(
		"/",
		asyncHandler(async (_req, res) => {
			const notifications = await listNotifications();
			res.json({ notifications });
		}),
	);

	router.post(
		"/otp",
		asyncHandler(async (req, res) => {
			const { to, code, displayName, ttlMinutes } = parse(
				otpNotificationSchema,
				req.body,
			);
			// Surface the code in dev (no provider) so flows can be exercised.
			if (!emailEnabled) {
				logger.info("OTP verification code (dev only)", { to, code });
			}
			const status = await deliver({
				type: "otp",
				to,
				subject: `${code} is your ${config.appName} verification code`,
				template: (
					<OtpVerificationEmail
						code={code}
						displayName={displayName}
						appName={config.appName}
						ttlMinutes={ttlMinutes}
					/>
				),
				metadata: { ttlMinutes },
			});
			res.json({ success: status !== "failed", status });
		}),
	);

	router.post(
		"/password-reset",
		asyncHandler(async (req, res) => {
			const { to, code, displayName, ttlMinutes } = parse(
				passwordResetNotificationSchema,
				req.body,
			);
			if (!emailEnabled) {
				logger.info("Password reset code (dev only)", { to, code });
			}
			const status = await deliver({
				type: "password_reset",
				to,
				subject: `${code} is your ${config.appName} password reset code`,
				template: (
					<PasswordResetEmail
						code={code}
						displayName={displayName}
						appName={config.appName}
						ttlMinutes={ttlMinutes}
					/>
				),
				metadata: { ttlMinutes },
			});
			res.json({ success: status !== "failed", status });
		}),
	);

	router.post(
		"/inspection-scheduled",
		asyncHandler(async (req, res) => {
			const data = parse(inspectionScheduledSchema, req.body);
			const status = await deliver({
				type: "inspection_scheduled",
				to: data.to,
				subject: `Inspection scheduled for extinguisher ${data.extinguisherSerial}`,
				template: (
					<InspectionScheduledEmail
						displayName={data.displayName}
						extinguisherSerial={data.extinguisherSerial}
						location={data.location}
						date={data.date}
						time={data.time}
						appName={config.appName}
					/>
				),
				metadata: {
					extinguisherSerial: data.extinguisherSerial,
					date: data.date,
					time: data.time,
				},
			});
			res.json({ success: status !== "failed", status });
		}),
	);

	router.post(
		"/maintenance-logged",
		asyncHandler(async (req, res) => {
			const data = parse(maintenanceLoggedSchema, req.body);
			const status = await deliver({
				type: "maintenance_logged",
				to: data.to,
				subject: `Maintenance logged for extinguisher ${data.extinguisherSerial}`,
				template: (
					<MaintenanceLoggedEmail
						displayName={data.displayName}
						extinguisherSerial={data.extinguisherSerial}
						actionTaken={data.actionTaken}
						date={data.date}
						notes={data.notes}
						appName={config.appName}
					/>
				),
				metadata: {
					extinguisherSerial: data.extinguisherSerial,
					actionTaken: data.actionTaken,
				},
			});
			res.json({ success: status !== "failed", status });
		}),
	);

	router.post(
		"/expiry-alert",
		asyncHandler(async (req, res) => {
			const data = parse(expiryAlertSchema, req.body);
			const status = await deliver({
				type: "expiry_alert",
				to: data.to,
				subject: `Extinguisher ${data.extinguisherSerial} expiry alert`,
				template: (
					<ExpiryAlertEmail
						displayName={data.displayName}
						extinguisherSerial={data.extinguisherSerial}
						location={data.location}
						expiryDate={data.expiryDate}
						daysRemaining={data.daysRemaining}
						appName={config.appName}
					/>
				),
				metadata: {
					extinguisherSerial: data.extinguisherSerial,
					expiryDate: data.expiryDate,
				},
			});
			res.json({ success: status !== "failed", status });
		}),
	);

	router.post(
		"/email",
		asyncHandler(async (req, res) => {
			const { to, subject, heading, body, displayName } = parse(
				genericEmailSchema,
				req.body,
			);
			const status = await deliver({
				type: "generic",
				to,
				subject,
				template: (
					<EmailLayout
						preview={subject}
						heading={heading ?? subject}
						appName={config.appName}
					>
						{displayName ? (
							<Text style={paragraph}>Hi {displayName},</Text>
						) : null}
						<Text style={paragraph}>{body}</Text>
					</EmailLayout>
				),
			});
			res.json({ success: status !== "failed", status });
		}),
	);

	return router;
};
