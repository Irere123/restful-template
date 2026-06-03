import { ApiError, asyncHandler, generateId, parse } from "@repo/core";
import { Router } from "express";

import {
	createInspection,
	deleteInspection,
	getExtinguisherById,
	getInspectionById,
	listInspections,
	updateInspection,
} from "@management/db/queries";
import { notifyInspectionScheduled } from "@management/lib/notifications";
import { getAlertRecipients } from "@management/lib/recipients";
import logger from "@management/logger";
import { requireAuth, requireRole } from "@management/middleware/auth";
import {
	completeInspectionSchema,
	listInspectionsQuerySchema,
	scheduleInspectionSchema,
	updateInspectionSchema,
} from "@management/schemas";
import { getIdParam } from "@management/utils";

/**
 * Inspection scheduling & completion. Any authenticated user may schedule an
 * inspection; only inspectors/admins may complete one or change its schedule.
 */
export const createInspectionsRouter = (): Router => {
	const router = Router();

	router.use(requireAuth);

	router.post(
		"/",
		asyncHandler(async (req, res) => {
			const data = parse(scheduleInspectionSchema, req.body);

			const extinguisher = await getExtinguisherById(data.extinguisherId);
			if (!extinguisher) {
				throw new ApiError({
					code: "NOT_FOUND",
					message: "Extinguisher not found",
				});
			}

			const inspection = await createInspection({
				id: await generateId(),
				extinguisherId: data.extinguisherId,
				scheduledDate: data.scheduledDate,
				scheduledTime: data.scheduledTime ?? null,
				notes: data.notes ?? null,
				scheduledBy: req.userId ?? null,
			});

			// Notify the relevant personnel — the inspectors/admins on the alert
			// roster plus the scheduling user (and any explicit recipient). All
			// best-effort: a notification or directory outage must never fail
			// scheduling, since the inspection is already saved.
			const recipients = new Map<
				string,
				{ to: string; displayName?: string }
			>();
			const addRecipient = (email?: string | null, displayName?: string) => {
				const to = email?.trim();
				if (!to) return;
				const key = to.toLowerCase();
				if (!recipients.has(key)) recipients.set(key, { to, displayName });
			};

			addRecipient(data.notifyEmail);
			addRecipient(req.userEmail);
			try {
				for (const recipient of await getAlertRecipients()) {
					addRecipient(recipient.email, recipient.displayName);
				}
			} catch (err) {
				logger.error("Failed to resolve inspection alert recipients", {
					error: err instanceof Error ? err.message : String(err),
				});
			}

			await Promise.all(
				[...recipients.values()].map((recipient) =>
					notifyInspectionScheduled({
						to: recipient.to,
						displayName: recipient.displayName,
						extinguisherSerial: extinguisher.serialNumber,
						location: extinguisher.location,
						date: data.scheduledDate,
						time: data.scheduledTime,
					}),
				),
			);

			res.status(201).json({ inspection });
		}),
	);

	router.get(
		"/",
		asyncHandler(async (req, res) => {
			const filters = parse(listInspectionsQuerySchema, req.query);
			const inspections = await listInspections(filters);
			res.json({ inspections });
		}),
	);

	router.get(
		"/:id",
		asyncHandler(async (req, res) => {
			const inspection = await getInspectionById(getIdParam(req.params.id));
			if (!inspection) {
				throw new ApiError({
					code: "NOT_FOUND",
					message: "Inspection not found",
				});
			}
			res.json({ inspection });
		}),
	);

	router.post(
		"/:id/complete",
		requireRole("admin", "inspector"),
		asyncHandler(async (req, res) => {
			const id = getIdParam(req.params.id);
			const data = parse(completeInspectionSchema, req.body);

			const existing = await getInspectionById(id);
			if (!existing) {
				throw new ApiError({
					code: "NOT_FOUND",
					message: "Inspection not found",
				});
			}
			if (existing.status === "completed") {
				throw new ApiError({
					code: "CONFLICT",
					message: "Inspection is already completed",
				});
			}

			const inspection = await updateInspection(id, {
				status: "completed",
				result: data.result,
				notes: data.notes ?? existing.notes,
				inspectorId: req.userId ?? null,
				completedAt: new Date(),
			});
			res.json({ inspection });
		}),
	);

	router.patch(
		"/:id",
		requireRole("admin", "inspector"),
		asyncHandler(async (req, res) => {
			const id = getIdParam(req.params.id);
			const data = parse(updateInspectionSchema, req.body);

			const inspection = await updateInspection(id, data);
			if (!inspection) {
				throw new ApiError({
					code: "NOT_FOUND",
					message: "Inspection not found",
				});
			}
			res.json({ inspection });
		}),
	);

	router.delete(
		"/:id",
		requireRole("admin"),
		asyncHandler(async (req, res) => {
			const ok = await deleteInspection(getIdParam(req.params.id));
			if (!ok) {
				throw new ApiError({
					code: "NOT_FOUND",
					message: "Inspection not found",
				});
			}
			res.json({ success: true });
		}),
	);

	return router;
};
