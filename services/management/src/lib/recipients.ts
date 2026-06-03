import config from "@management/config";
import { serviceRequest } from "@repo/core";

export type AlertRecipient = {
	id: string;
	email: string;
	displayName: string;
	role: string;
};

/**
 * Resolve the people who should receive compliance alerts (by default admins
 * and inspectors) from the auth service over the internal API. Management owns
 * no user data, so the recipient directory lives in auth.
 *
 * Throws (via {@link serviceRequest}) if auth is unreachable — callers in the
 * cron jobs catch and log so a notification outage never crashes the scheduler.
 */
export const getAlertRecipients = async (): Promise<AlertRecipient[]> => {
	const roles = config.alertRecipientRoles.join(",");
	const { users } = await serviceRequest<{ users: AlertRecipient[] }>(
		`${config.authUrl}/internal/users?roles=${encodeURIComponent(roles)}`,
		{ internalKey: config.internalApiKey },
	);
	return users;
};
