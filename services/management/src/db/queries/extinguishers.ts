import { db } from "@management/db";
import {
	type Extinguisher,
	type ExtinguisherStatus,
	type ExtinguisherType,
	extinguishers,
	type NewExtinguisher,
} from "@management/db/schema";
import { ApiError } from "@repo/core";
import { and, eq, type SQL } from "drizzle-orm";

export type CreateExtinguisherInput = {
	id: string;
	serialNumber: string;
	location: string;
	type: ExtinguisherType;
	size: NewExtinguisher["size"];
	installationDate: string;
	expiryDate: string;
	status?: ExtinguisherStatus;
	createdBy?: string | null;
};

export type UpdateExtinguisherInput = {
	serialNumber?: string;
	location?: string;
	type?: ExtinguisherType;
	size?: NewExtinguisher["size"];
	installationDate?: string;
	expiryDate?: string;
	status?: ExtinguisherStatus;
};

export type ExtinguisherFilters = {
	status?: ExtinguisherStatus;
	type?: ExtinguisherType;
};

export const createExtinguisher = async (
	input: CreateExtinguisherInput,
): Promise<Extinguisher> => {
	const [row] = await db.insert(extinguishers).values(input).returning();
	if (!row) {
		throw new ApiError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to create extinguisher",
		});
	}
	return row;
};

export const getExtinguisherById = async (
	id: string,
): Promise<Extinguisher | undefined> => {
	return db.query.extinguishers.findFirst({
		where: eq(extinguishers.id, id),
	});
};

export const getExtinguisherBySerial = async (
	serialNumber: string,
): Promise<Extinguisher | undefined> => {
	return db.query.extinguishers.findFirst({
		where: eq(extinguishers.serialNumber, serialNumber),
	});
};

export const listExtinguishers = async (
	filters: ExtinguisherFilters = {},
): Promise<Extinguisher[]> => {
	const conditions: SQL[] = [];
	if (filters.status) {
		conditions.push(eq(extinguishers.status, filters.status));
	}
	if (filters.type) {
		conditions.push(eq(extinguishers.type, filters.type));
	}

	return db.query.extinguishers.findMany({
		where: conditions.length ? and(...conditions) : undefined,
		orderBy: (e, { desc }) => desc(e.createdAt),
	});
};

export const updateExtinguisher = async (
	id: string,
	values: UpdateExtinguisherInput,
): Promise<Extinguisher | undefined> => {
	const [row] = await db
		.update(extinguishers)
		.set({
			...values,
			updatedAt: new Date(),
		} as typeof extinguishers.$inferInsert)
		.where(eq(extinguishers.id, id))
		.returning();
	return row;
};

export const deleteExtinguisher = async (id: string): Promise<boolean> => {
	const deleted = await db
		.delete(extinguishers)
		.where(eq(extinguishers.id, id))
		.returning({ id: extinguishers.id });
	return deleted.length > 0;
};
