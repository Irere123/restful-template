import { jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Delivery outcome of a notification. */
export const notificationStatusEnum = pgEnum("notification_status", [
	"sent",
	"skipped",
	"failed",
]);

/**
 * Append-only audit log of every notification this service is asked to deliver.
 * `skipped` means no email provider was configured (development), `failed`
 * means the provider rejected the send.
 */
export const notifications = pgTable("notifications", {
	id: text("id").primaryKey(),
	// e.g. "otp", "password_reset", "inspection_scheduled", "maintenance_logged".
	type: text("type").notNull(),
	channel: text("channel").notNull().default("email"),
	recipient: text("recipient").notNull(),
	subject: text("subject").notNull(),
	status: notificationStatusEnum("status").notNull(),
	error: text("error"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationStatus =
	(typeof notificationStatusEnum.enumValues)[number];
