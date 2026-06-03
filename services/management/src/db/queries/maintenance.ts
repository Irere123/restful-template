import { db } from "@management/db";
import { type MaintenanceLog, maintenanceLogs } from "@management/db/schema";
import { ApiError } from "@repo/core";
import { eq } from "drizzle-orm";

export type CreateMaintenanceLogInput = {
	id: string;
	extinguisherId: string;
	inspectionId?: string | null;
	actionTaken: string;
	maintenanceDate: string;
	issuesIdentified?: string | null;
	notes?: string | null;
	inspectorId?: string | null;
};

export const createMaintenanceLog = async (
	input: CreateMaintenanceLogInput,
): Promise<MaintenanceLog> => {
	const [row] = await db.insert(maintenanceLogs).values(input).returning();
	if (!row) {
		throw new ApiError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to create maintenance log",
		});
	}
	return row;
};

export const getMaintenanceLogById = async (
	id: string,
): Promise<MaintenanceLog | undefined> => {
	return db.query.maintenanceLogs.findFirst({
		where: eq(maintenanceLogs.id, id),
	});
};

export const listMaintenanceLogs = async (
	extinguisherId?: string,
): Promise<MaintenanceLog[]> => {
	return db.query.maintenanceLogs.findMany({
		where: extinguisherId
			? eq(maintenanceLogs.extinguisherId, extinguisherId)
			: undefined,
		orderBy: (m, { desc }) => desc(m.maintenanceDate),
	});
};
