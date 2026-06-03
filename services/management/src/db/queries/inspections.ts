import { db } from "@management/db";
import {
	extinguishers,
	type Inspection,
	type InspectionResult,
	type InspectionStatus,
	inspections,
} from "@management/db/schema";
import { ApiError } from "@repo/core";
import { and, eq, gte, lt, lte, type SQL } from "drizzle-orm";

export type CreateInspectionInput = {
	id: string;
	extinguisherId: string;
	scheduledDate: string;
	scheduledTime?: string | null;
	notes?: string | null;
	scheduledBy?: string | null;
};

export type UpdateInspectionInput = {
	scheduledDate?: string;
	scheduledTime?: string | null;
	status?: InspectionStatus;
	result?: InspectionResult | null;
	notes?: string | null;
	inspectorId?: string | null;
	completedAt?: Date | null;
};

export type InspectionFilters = {
	status?: InspectionStatus;
	extinguisherId?: string;
};

export const createInspection = async (
	input: CreateInspectionInput,
): Promise<Inspection> => {
	const [row] = await db.insert(inspections).values(input).returning();
	if (!row) {
		throw new ApiError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to create inspection",
		});
	}
	return row;
};

export const getInspectionById = async (
	id: string,
): Promise<Inspection | undefined> => {
	return db.query.inspections.findFirst({ where: eq(inspections.id, id) });
};

export const listInspections = async (
	filters: InspectionFilters = {},
): Promise<Inspection[]> => {
	const conditions: SQL[] = [];
	if (filters.status) {
		conditions.push(eq(inspections.status, filters.status));
	}
	if (filters.extinguisherId) {
		conditions.push(eq(inspections.extinguisherId, filters.extinguisherId));
	}

	return db.query.inspections.findMany({
		where: conditions.length ? and(...conditions) : undefined,
		orderBy: (i, { desc }) => desc(i.scheduledDate),
	});
};

export const updateInspection = async (
	id: string,
	values: UpdateInspectionInput,
): Promise<Inspection | undefined> => {
	const [row] = await db
		.update(inspections)
		.set({
			...values,
			updatedAt: new Date(),
		} as typeof inspections.$inferInsert)
		.where(eq(inspections.id, id))
		.returning();
	return row;
};

export const deleteInspection = async (id: string): Promise<boolean> => {
	const deleted = await db
		.delete(inspections)
		.where(eq(inspections.id, id))
		.returning({ id: inspections.id });
	return deleted.length > 0;
};

/** A scheduled inspection joined to its extinguisher, for reminder digests. */
export type InspectionReminderRow = {
	serialNumber: string;
	location: string;
	scheduledDate: string;
	scheduledTime: string | null;
};

const reminderColumns = {
	serialNumber: extinguishers.serialNumber,
	location: extinguishers.location,
	scheduledDate: inspections.scheduledDate,
	scheduledTime: inspections.scheduledTime,
};

/** Scheduled inspections due within [today, windowEnd] (upcoming reminders). */
export const listUpcomingInspections = async (
	today: string,
	windowEnd: string,
): Promise<InspectionReminderRow[]> => {
	return db
		.select(reminderColumns)
		.from(inspections)
		.innerJoin(extinguishers, eq(inspections.extinguisherId, extinguishers.id))
		.where(
			and(
				eq(inspections.status, "scheduled"),
				gte(inspections.scheduledDate, today),
				lte(inspections.scheduledDate, windowEnd),
			),
		)
		.orderBy(inspections.scheduledDate);
};

/** Scheduled inspections whose date has already passed (overdue reminders). */
export const listOverdueInspections = async (
	today: string,
): Promise<InspectionReminderRow[]> => {
	return db
		.select(reminderColumns)
		.from(inspections)
		.innerJoin(extinguishers, eq(inspections.extinguisherId, extinguishers.id))
		.where(
			and(
				eq(inspections.status, "scheduled"),
				lt(inspections.scheduledDate, today),
			),
		)
		.orderBy(inspections.scheduledDate);
};
