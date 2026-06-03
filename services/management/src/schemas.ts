import { z } from "zod";

import {
	extinguisherSizeEnum,
	extinguisherStatusEnum,
	extinguisherTypeEnum,
	inspectionResultEnum,
	inspectionStatusEnum,
} from "@management/db/schema";

export const extinguisherTypeSchema = z.enum(extinguisherTypeEnum.enumValues);
export const extinguisherSizeSchema = z.enum(extinguisherSizeEnum.enumValues);
export const extinguisherStatusSchema = z.enum(
	extinguisherStatusEnum.enumValues,
);
export const inspectionResultSchema = z.enum(inspectionResultEnum.enumValues);

/** Calendar date, `YYYY-MM-DD`. */
const dateString = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a date in YYYY-MM-DD format");

/** 24-hour time, `HH:MM`. */
const timeString = z
	.string()
	.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be a time in HH:MM format");

export const createExtinguisherSchema = z
	.object({
		serialNumber: z.string().trim().min(1).max(100),
		location: z.string().trim().min(1).max(200),
		type: extinguisherTypeSchema,
		size: extinguisherSizeSchema,
		installationDate: dateString,
		expiryDate: dateString,
		status: extinguisherStatusSchema.optional(),
	})
	.refine((v) => v.expiryDate >= v.installationDate, {
		message: "Expiry date must be on or after the installation date",
		path: ["expiryDate"],
	});

export const updateExtinguisherSchema = z
	.object({
		serialNumber: z.string().trim().min(1).max(100).optional(),
		location: z.string().trim().min(1).max(200).optional(),
		type: extinguisherTypeSchema.optional(),
		size: extinguisherSizeSchema.optional(),
		installationDate: dateString.optional(),
		expiryDate: dateString.optional(),
		status: extinguisherStatusSchema.optional(),
	})
	.refine((v) => Object.keys(v).length > 0, {
		message: "No fields to update",
	});

export const listExtinguishersQuerySchema = z.object({
	status: extinguisherStatusSchema.optional(),
	type: extinguisherTypeSchema.optional(),
});

export const scheduleInspectionSchema = z.object({
	extinguisherId: z.string().min(1),
	scheduledDate: dateString,
	scheduledTime: timeString.optional(),
	notes: z.string().max(2000).optional(),
	/** Optional explicit recipient; defaults to the scheduling user's email. */
	notifyEmail: z.string().email().optional(),
});

export const updateInspectionSchema = z
	.object({
		scheduledDate: dateString.optional(),
		scheduledTime: timeString.optional(),
		status: z.enum(["scheduled", "cancelled"]).optional(),
		notes: z.string().max(2000).optional(),
	})
	.refine((v) => Object.keys(v).length > 0, {
		message: "No fields to update",
	});

export const completeInspectionSchema = z.object({
	result: inspectionResultSchema,
	notes: z.string().max(2000).optional(),
});

export const listInspectionsQuerySchema = z.object({
	status: z.enum(inspectionStatusEnum.enumValues).optional(),
	extinguisherId: z.string().optional(),
});

export const createMaintenanceSchema = z.object({
	extinguisherId: z.string().min(1),
	inspectionId: z.string().optional(),
	actionTaken: z.string().trim().min(1).max(500),
	maintenanceDate: dateString,
	issuesIdentified: z.string().max(2000).optional(),
	notes: z.string().max(2000).optional(),
	/** Optionally move the extinguisher to a new status after maintenance. */
	updateStatus: extinguisherStatusSchema.optional(),
});

export const listMaintenanceQuerySchema = z.object({
	extinguisherId: z.string().optional(),
});
