import config from "@management/config";
import logger from "@management/logger";
import { serviceRequest } from "@repo/core";

/**
 * Fire-and-forget client over the notification service. Failures are logged but
 * never propagated — a notification outage must not fail the underlying
 * management operation (the inspection/maintenance record is already saved).
 */

export type InspectionScheduledNotification = {
	to: string;
	displayName?: string;
	extinguisherSerial: string;
	location?: string;
	date: string;
	time?: string;
};

export const notifyInspectionScheduled = async (
	input: InspectionScheduledNotification,
): Promise<void> => {
	try {
		await serviceRequest(
			`${config.notificationUrl}/notifications/inspection-scheduled`,
			{ method: "POST", internalKey: config.internalApiKey, body: input },
		);
	} catch (err) {
		logger.error("Failed to send inspection-scheduled notification", {
			error: err instanceof Error ? err.message : String(err),
		});
	}
};

export type MaintenanceLoggedNotification = {
	to: string;
	displayName?: string;
	extinguisherSerial: string;
	actionTaken: string;
	date: string;
	notes?: string;
};

export const notifyMaintenanceLogged = async (
	input: MaintenanceLoggedNotification,
): Promise<void> => {
	try {
		await serviceRequest(
			`${config.notificationUrl}/notifications/maintenance-logged`,
			{ method: "POST", internalKey: config.internalApiKey, body: input },
		);
	} catch (err) {
		logger.error("Failed to send maintenance-logged notification", {
			error: err instanceof Error ? err.message : String(err),
		});
	}
};

export type ExpiryDigestItem = {
	serialNumber: string;
	location?: string;
	expiryDate: string;
	daysRemaining?: number;
};

export const notifyExpiryDigest = async (input: {
	to: string;
	displayName?: string;
	expiringSoon: ExpiryDigestItem[];
	expired: ExpiryDigestItem[];
}): Promise<void> => {
	try {
		await serviceRequest(
			`${config.notificationUrl}/notifications/expiry-digest`,
			{ method: "POST", internalKey: config.internalApiKey, body: input },
		);
	} catch (err) {
		logger.error("Failed to send expiry-digest notification", {
			error: err instanceof Error ? err.message : String(err),
		});
	}
};

export type InspectionReminderItem = {
	serialNumber: string;
	location?: string;
	scheduledDate: string;
	scheduledTime?: string;
};

export const notifyInspectionReminder = async (input: {
	to: string;
	displayName?: string;
	upcoming: InspectionReminderItem[];
	overdue: InspectionReminderItem[];
}): Promise<void> => {
	try {
		await serviceRequest(
			`${config.notificationUrl}/notifications/inspection-reminder`,
			{ method: "POST", internalKey: config.internalApiKey, body: input },
		);
	} catch (err) {
		logger.error("Failed to send inspection-reminder notification", {
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
