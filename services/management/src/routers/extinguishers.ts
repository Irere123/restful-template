import {
	createExtinguisher,
	deleteExtinguisher,
	getExtinguisherById,
	getExtinguisherBySerial,
	listExtinguishers,
	updateExtinguisher,
} from "@management/db/queries";
import { requireAuth, requireRole } from "@management/middleware/auth";
import {
	createExtinguisherSchema,
	listExtinguishersQuerySchema,
	updateExtinguisherSchema,
} from "@management/schemas";
import { getIdParam } from "@management/utils";
import { ApiError, asyncHandler, generateId, parse } from "@repo/core";
import { Router } from "express";

/**
 * Fire extinguisher registry. Reads are open to any authenticated user;
 * create/update require admin or inspector; delete is admin-only.
 */
export const createExtinguishersRouter = (): Router => {
	const router = Router();

	router.use(requireAuth);

	router.post(
		"/",
		requireRole("admin", "inspector"),
		asyncHandler(async (req, res) => {
			const data = parse(createExtinguisherSchema, req.body);

			if (await getExtinguisherBySerial(data.serialNumber)) {
				throw new ApiError({
					code: "CONFLICT",
					message: "An extinguisher with this serial number already exists",
				});
			}

			const extinguisher = await createExtinguisher({
				id: await generateId(),
				...data,
				createdBy: req.userId ?? null,
			});
			res.status(201).json({ extinguisher });
		}),
	);

	router.get(
		"/",
		asyncHandler(async (req, res) => {
			const filters = parse(listExtinguishersQuerySchema, req.query);
			const extinguishers = await listExtinguishers(filters);
			res.json({ extinguishers });
		}),
	);

	router.get(
		"/:id",
		asyncHandler(async (req, res) => {
			const extinguisher = await getExtinguisherById(getIdParam(req.params.id));
			if (!extinguisher) {
				throw new ApiError({
					code: "NOT_FOUND",
					message: "Extinguisher not found",
				});
			}
			res.json({ extinguisher });
		}),
	);

	router.patch(
		"/:id",
		requireRole("admin", "inspector"),
		asyncHandler(async (req, res) => {
			const id = getIdParam(req.params.id);
			const data = parse(updateExtinguisherSchema, req.body);

			if (data.serialNumber) {
				const existing = await getExtinguisherBySerial(data.serialNumber);
				if (existing && existing.id !== id) {
					throw new ApiError({
						code: "CONFLICT",
						message: "Serial number already in use",
					});
				}
			}

			const extinguisher = await updateExtinguisher(id, data);
			if (!extinguisher) {
				throw new ApiError({
					code: "NOT_FOUND",
					message: "Extinguisher not found",
				});
			}
			res.json({ extinguisher });
		}),
	);

	router.delete(
		"/:id",
		requireRole("admin"),
		asyncHandler(async (req, res) => {
			const ok = await deleteExtinguisher(getIdParam(req.params.id));
			if (!ok) {
				throw new ApiError({
					code: "NOT_FOUND",
					message: "Extinguisher not found",
				});
			}
			res.json({ success: true });
		}),
	);

	return router;
};
