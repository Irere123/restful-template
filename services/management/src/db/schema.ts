import {
	date,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

/** Extinguishing agent type. */
export const extinguisherTypeEnum = pgEnum("extinguisher_type", [
	"water",
	"co2",
	"foam",
	"dry_chemical",
]);

/**
 * Extinguisher capacity. Values per the exam specification: 2.5 lb, 5 lb,
 * 9 lb, 12 lb (note: 2.5 lb, not 1.5 lb).
 */
export const extinguisherSizeEnum = pgEnum("extinguisher_size", [
	"2.5lb",
	"5lb",
	"9lb",
	"12lb",
]);

/** Lifecycle status of an extinguisher unit. */
export const extinguisherStatusEnum = pgEnum("extinguisher_status", [
	"active",
	"maintenance",
	"expired",
	"decommissioned",
]);

/** Lifecycle status of a scheduled inspection. */
export const inspectionStatusEnum = pgEnum("inspection_status", [
	"scheduled",
	"completed",
	"cancelled",
]);

/** Outcome recorded when an inspection is completed. */
export const inspectionResultEnum = pgEnum("inspection_result", [
	"pass",
	"fail",
	"needs_maintenance",
]);

export const extinguishers = pgTable("extinguishers", {
	id: text("id").primaryKey(),
	serialNumber: text("serial_number").notNull().unique(),
	location: text("location").notNull(),
	type: extinguisherTypeEnum("type").notNull(),
	size: extinguisherSizeEnum("size").notNull(),
	installationDate: date("installation_date").notNull(),
	expiryDate: date("expiry_date").notNull(),
	status: extinguisherStatusEnum("status").notNull().default("active"),
	// User id (from the auth service's JWT) of whoever registered the unit.
	// No DB-level FK — users live in a different service's database.
	createdBy: text("created_by"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inspections = pgTable("inspections", {
	id: text("id").primaryKey(),
	extinguisherId: text("extinguisher_id")
		.notNull()
		.references(() => extinguishers.id, { onDelete: "cascade" }),
	scheduledDate: date("scheduled_date").notNull(),
	scheduledTime: text("scheduled_time"),
	status: inspectionStatusEnum("status").notNull().default("scheduled"),
	result: inspectionResultEnum("result"),
	notes: text("notes"),
	// User ids from the auth service (no cross-service FK).
	scheduledBy: text("scheduled_by"),
	inspectorId: text("inspector_id"),
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const maintenanceLogs = pgTable("maintenance_logs", {
	id: text("id").primaryKey(),
	extinguisherId: text("extinguisher_id")
		.notNull()
		.references(() => extinguishers.id, { onDelete: "cascade" }),
	// Optional link to the inspection that triggered the maintenance.
	inspectionId: text("inspection_id").references(() => inspections.id, {
		onDelete: "set null",
	}),
	actionTaken: text("action_taken").notNull(),
	maintenanceDate: date("maintenance_date").notNull(),
	issuesIdentified: text("issues_identified"),
	notes: text("notes"),
	inspectorId: text("inspector_id"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Extinguisher = typeof extinguishers.$inferSelect;
export type NewExtinguisher = typeof extinguishers.$inferInsert;
export type ExtinguisherType = (typeof extinguisherTypeEnum.enumValues)[number];
export type ExtinguisherSize = (typeof extinguisherSizeEnum.enumValues)[number];
export type ExtinguisherStatus =
	(typeof extinguisherStatusEnum.enumValues)[number];

export type Inspection = typeof inspections.$inferSelect;
export type NewInspection = typeof inspections.$inferInsert;
export type InspectionStatus = (typeof inspectionStatusEnum.enumValues)[number];
export type InspectionResult = (typeof inspectionResultEnum.enumValues)[number];

export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
export type NewMaintenanceLog = typeof maintenanceLogs.$inferInsert;
