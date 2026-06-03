import config from "@notification/config";
import { listNotifications, logNotification } from "@notification/db/queries";
import type { NotificationStatus } from "@notification/db/schema";
import { AccountDeletedEmail } from "@notification/emails/account-deleted";
import { ExpiryAlertEmail } from "@notification/emails/expiry-alert";
import { ExpiryDigestEmail } from "@notification/emails/expiry-digest";
import { InspectionReminderEmail } from "@notification/emails/inspection-reminder";
import { InspectionScheduledEmail } from "@notification/emails/inspection-scheduled";
import { EmailLayout, paragraph } from "@notification/emails/layout";
import { LoginAlertEmail } from "@notification/emails/login-alert";
import { LogoutAlertEmail } from "@notification/emails/logout-alert";
import { MaintenanceLoggedEmail } from "@notification/emails/maintenance-logged";
import { OtpVerificationEmail } from "@notification/emails/otp-verification";
import { PasswordResetEmail } from "@notification/emails/password-reset";
import { WelcomeEmail } from "@notification/emails/welcome";
import { emailEnabled, sendEmail } from "@notification/lib/email";
import logger from "@notification/logger";
import {
	accountDeletedSchema,
	expiryAlertSchema,
	expiryDigestSchema,
	genericEmailSchema,
	inspectionReminderSchema,
	inspectionScheduledSchema,
	loginAlertSchema,
	logoutAlertSchema,
	maintenanceLoggedSchema,
	otpNotificationSchema,
	passwordResetNotificationSchema,
	welcomeSchema,
} from "@notification/schemas";
import { Text } from "@react-email/components";
import { asyncHandler, createRequireInternal, parse } from "@repo/core";
import { Router } from "express";
import type { ReactElement } from "react";

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
		"/welcome",
		asyncHandler(async (req, res) => {
			const { to, displayName } = parse(welcomeSchema, req.body);
			const status = await deliver({
				type: "welcome",
				to,
				subject: `Welcome to ${config.appName}`,
				template: (
					<WelcomeEmail displayName={displayName} appName={config.appName} />
				),
			});
			res.json({ success: status !== "failed", status });
		}),
	);

	router.post(
		"/login-alert",
		asyncHandler(async (req, res) => {
			const data = parse(loginAlertSchema, req.body);
			const status = await deliver({
				type: "login_alert",
				to: data.to,
				subject: `New sign-in to your ${config.appName} account`,
				template: (
					<LoginAlertEmail
						displayName={data.displayName}
						time={data.time}
						ipAddress={data.ipAddress}
						userAgent={data.userAgent}
						appName={config.appName}
					/>
				),
				metadata: { ipAddress: data.ipAddress, time: data.time },
			});
			res.json({ success: status !== "failed", status });
		}),
	);

	router.post(
		"/logout-alert",
		asyncHandler(async (req, res) => {
			const data = parse(logoutAlertSchema, req.body);
			const status = await deliver({
				type: "logout_alert",
				to: data.to,
				subject: data.allDevices
					? `You were signed out of all ${config.appName} devices`
					: `You were signed out of ${config.appName}`,
				template: (
					<LogoutAlertEmail
						displayName={data.displayName}
						time={data.time}
						allDevices={data.allDevices}
						appName={config.appName}
					/>
				),
				metadata: { allDevices: data.allDevices ?? false },
			});
			res.json({ success: status !== "failed", status });
		}),
	);

	router.post(
		"/account-deleted",
		asyncHandler(async (req, res) => {
			const data = parse(accountDeletedSchema, req.body);
			const status = await deliver({
				type: "account_deleted",
				to: data.to,
				subject: `Your ${config.appName} account has been deleted`,
				template: (
					<AccountDeletedEmail
						displayName={data.displayName}
						byAdmin={data.byAdmin}
						appName={config.appName}
					/>
				),
				metadata: { byAdmin: data.byAdmin ?? false },
			});
			res.json({ success: status !== "failed", status });
		}),
	);

	router.post(
		"/expiry-digest",
		asyncHandler(async (req, res) => {
			const data = parse(expiryDigestSchema, req.body);
			const total = data.expiringSoon.length + data.expired.length;
			const status = await deliver({
				type: "expiry_digest",
				to: data.to,
				subject: `${config.appName}: ${total} extinguisher(s) need attention`,
				template: (
					<ExpiryDigestEmail
						displayName={data.displayName}
						expiringSoon={data.expiringSoon}
						expired={data.expired}
						appName={config.appName}
					/>
				),
				metadata: {
					expiringSoon: data.expiringSoon.length,
					expired: data.expired.length,
				},
			});
			res.json({ success: status !== "failed", status });
		}),
	);

	router.post(
		"/inspection-reminder",
		asyncHandler(async (req, res) => {
			const data = parse(inspectionReminderSchema, req.body);
			const total = data.upcoming.length + data.overdue.length;
			const status = await deliver({
				type: "inspection_reminder",
				to: data.to,
				subject: `${config.appName}: ${total} inspection(s) need attention`,
				template: (
					<InspectionReminderEmail
						displayName={data.displayName}
						upcoming={data.upcoming}
						overdue={data.overdue}
						appName={config.appName}
					/>
				),
				metadata: {
					upcoming: data.upcoming.length,
					overdue: data.overdue.length,
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
