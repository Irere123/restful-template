import config from "@management/config";
import {
	listExpiringExtinguishers,
	listOverdueInspections,
	listUpcomingInspections,
	markExpiredExtinguishers,
} from "@management/db/queries";
import { addDaysIso, daysBetween, todayIso } from "@management/lib/date";
import {
	type ExpiryDigestItem,
	type InspectionReminderItem,
	notifyExpiryDigest,
	notifyInspectionReminder,
} from "@management/lib/notifications";
import {
	type AlertRecipient,
	getAlertRecipients,
} from "@management/lib/recipients";
import logger from "@management/logger";

export type ExpiryScanSummary = {
	expiringSoon: number;
	expired: number;
	recipients: number;
};

export type InspectionReminderSummary = {
	upcoming: number;
	overdue: number;
	recipients: number;
};

const loadRecipients = async (job: string): Promise<AlertRecipient[]> => {
	try {
		return await getAlertRecipients();
	} catch (err) {
		logger.error(`${job}: failed to load recipients`, {
			error: err instanceof Error ? err.message : String(err),
		});
		return [];
	}
};

/**
 * Scheduled expiry scan: mark newly-expired units, then email admins/inspectors
 * a digest of expired + soon-to-expire extinguishers. Safe to run repeatedly —
 * each unit is only marked (and so alerted) once it crosses its expiry date.
 */
export const runExpiryScan = async (): Promise<ExpiryScanSummary> => {
	const today = todayIso();
	const windowEnd = addDaysIso(today, config.expiryWindowDays);

	// Flip the units that have just expired; the returned rows are the ones to
	// report as "expired" this run.
	const expiredRows = await markExpiredExtinguishers(today);
	const expiringRows = await listExpiringExtinguishers(today, windowEnd);

	const toItem = (e: {
		serialNumber: string;
		location: string;
		expiryDate: string;
	}): ExpiryDigestItem => ({
		serialNumber: e.serialNumber,
		location: e.location,
		expiryDate: e.expiryDate,
		daysRemaining: daysBetween(today, e.expiryDate),
	});

	const expired = expiredRows.map(toItem);
	const expiringSoon = expiringRows.map(toItem);

	const summary: ExpiryScanSummary = {
		expiringSoon: expiringSoon.length,
		expired: expired.length,
		recipients: 0,
	};

	if (expiringSoon.length === 0 && expired.length === 0) {
		logger.info("Expiry scan: nothing to report", summary);
		return summary;
	}

	const recipients = await loadRecipients("Expiry scan");
	await Promise.all(
		recipients.map((r) =>
			notifyExpiryDigest({
				to: r.email,
				displayName: r.displayName,
				expiringSoon,
				expired,
			}),
		),
	);

	summary.recipients = recipients.length;
	logger.info("Expiry scan complete", summary);
	return summary;
};

/**
 * Scheduled inspection reminder: email admins/inspectors a digest of overdue +
 * upcoming scheduled inspections.
 */
export const runInspectionReminders =
	async (): Promise<InspectionReminderSummary> => {
		const today = todayIso();
		const windowEnd = addDaysIso(today, config.inspectionReminderWindowDays);

		const upcomingRows = await listUpcomingInspections(today, windowEnd);
		const overdueRows = await listOverdueInspections(today);

		const toItem = (r: {
			serialNumber: string;
			location: string;
			scheduledDate: string;
			scheduledTime: string | null;
		}): InspectionReminderItem => ({
			serialNumber: r.serialNumber,
			location: r.location,
			scheduledDate: r.scheduledDate,
			scheduledTime: r.scheduledTime ?? undefined,
		});

		const upcoming = upcomingRows.map(toItem);
		const overdue = overdueRows.map(toItem);

		const summary: InspectionReminderSummary = {
			upcoming: upcoming.length,
			overdue: overdue.length,
			recipients: 0,
		};

		if (upcoming.length === 0 && overdue.length === 0) {
			logger.info("Inspection reminders: nothing to report", summary);
			return summary;
		}

		const recipients = await loadRecipients("Inspection reminders");
		await Promise.all(
			recipients.map((r) =>
				notifyInspectionReminder({
					to: r.email,
					displayName: r.displayName,
					upcoming,
					overdue,
				}),
			),
		);

		summary.recipients = recipients.length;
		logger.info("Inspection reminders complete", summary);
		return summary;
	};
