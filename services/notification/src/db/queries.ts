import { db } from "@notification/db";
import {
	type Notification,
	type NotificationStatus,
	notifications,
} from "@notification/db/schema";
import { generateId } from "@repo/core";

export type LogNotificationInput = {
	type: string;
	recipient: string;
	subject: string;
	status: NotificationStatus;
	error?: string | null;
	metadata?: Record<string, unknown> | null;
};

/** Persist an audit record for a notification delivery attempt. */
export const logNotification = async (
	input: LogNotificationInput,
): Promise<Notification> => {
	const [row] = await db
		.insert(notifications)
		.values({ id: await generateId(), ...input })
		.returning();
	return row!;
};

/** List recent notifications (most recent first), capped at `limit`. */
export const listNotifications = async (
	limit = 100,
): Promise<Notification[]> => {
	return db.query.notifications.findMany({
		orderBy: (n, { desc }) => desc(n.createdAt),
		limit,
	});
};
