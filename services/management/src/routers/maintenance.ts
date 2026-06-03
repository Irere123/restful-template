import { ApiError, asyncHandler, generateId, parse } from "@repo/core";
import { Router } from "express";

import {
	createMaintenanceLog,
	getExtinguisherById,
	getMaintenanceLogById,
	listMaintenanceLogs,
	updateExtinguisher,
} from "@management/db/queries";
import { notifyMaintenanceLogged } from "@management/lib/notifications";
import { requireAuth, requireRole } from "@management/middleware/auth";
import {
	createMaintenanceSchema,
	listMaintenanceQuerySchema,
} from "@management/schemas";
import { getIdParam } from "@management/utils";

/**
 * Maintenance logging. Inspectors and admins record maintenance activities;
 * any authenticated user may read the history.
 */
export const createMaintenanceRouter = (): Router => {
	const router = Router();

	router.use(requireAuth);

	router.post(
		"/",
		requireRole("admin", "inspector"),
		asyncHandler(async (req, res) => {
			const data = parse(createMaintenanceSchema, req.body);

			const extinguisher = await getExtinguisherById(data.extinguisherId);
			if (!extinguisher) {
				throw new ApiError({
					code: "NOT_FOUND",
					message: "Extinguisher not found",
				});
			}

			const maintenance = await createMaintenanceLog({
				id: await generateId(),
				extinguisherId: data.extinguisherId,
				inspectionId: data.inspectionId ?? null,
				actionTaken: data.actionTaken,
				maintenanceDate: data.maintenanceDate,
				issuesIdentified: data.issuesIdentified ?? null,
				notes: data.notes ?? null,
				inspectorId: req.userId ?? null,
			});

			// Optionally transition the extinguisher's lifecycle status.
			if (data.updateStatus) {
				await updateExtinguisher(data.extinguisherId, {
					status: data.updateStatus,
				});
			}

			// Notify the inspector (best-effort).
			if (req.userEmail) {
				await notifyMaintenanceLogged({
					to: req.userEmail,
					extinguisherSerial: extinguisher.serialNumber,
					actionTaken: data.actionTaken,
					date: data.maintenanceDate,
					notes: data.notes,
				});
			}

			res.status(201).json({ maintenance });
		}),
	);

	router.get(
		"/",
		asyncHandler(async (req, res) => {
			const { extinguisherId } = parse(
				listMaintenanceQuerySchema,
				req.query,
			);
			const maintenance = await listMaintenanceLogs(extinguisherId);
			res.json({ maintenance });
		}),
	);

	router.get(
		"/:id",
		asyncHandler(async (req, res) => {
			const maintenance = await getMaintenanceLogById(getIdParam(req.params.id));
			if (!maintenance) {
				throw new ApiError({
					code: "NOT_FOUND",
					message: "Maintenance record not found",
				});
			}
			res.json({ maintenance });
		}),
	);

	return router;
};
