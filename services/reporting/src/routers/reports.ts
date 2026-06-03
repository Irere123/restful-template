import { ApiError, asyncHandler, parse } from "@repo/core";
import { toCsv } from "@reporting/lib/csv";
import {
	complianceExport,
	inspectionExport,
	inventoryExport,
	maintenanceExport,
	type ReportExport,
} from "@reporting/lib/export";
import {
	fetchExtinguishers,
	fetchInspections,
	fetchMaintenance,
} from "@reporting/lib/management-client";
import { renderReportPdf } from "@reporting/lib/pdf";
import {
	buildComplianceReport,
	buildInspectionReport,
	buildInventoryReport,
	buildMaintenanceReport,
} from "@reporting/lib/reports";
import { requireAuth } from "@reporting/middleware/auth";
import { Router } from "express";
import { z } from "zod";

const exportQuerySchema = z.object({
	format: z.enum(["csv", "pdf"]).default("pdf"),
});
const windowQuerySchema = z.object({
	windowDays: z.coerce.number().int().positive().max(3650).optional(),
});
const recentQuerySchema = z.object({
	recentDays: z.coerce.number().int().positive().max(3650).optional(),
});

const REPORT_TYPES = [
	"inventory",
	"inspections",
	"compliance",
	"maintenance",
] as const;
type ReportType = (typeof REPORT_TYPES)[number];

/** Build the export payload (CSV rows + PDF structure) for a report type. */
const buildExport = async (
	type: ReportType,
	cookie?: string,
): Promise<ReportExport> => {
	switch (type) {
		case "inventory": {
			const extinguishers = await fetchExtinguishers(cookie);
			return inventoryExport(
				extinguishers,
				buildInventoryReport(extinguishers),
			);
		}
		case "inspections": {
			const inspections = await fetchInspections(cookie);
			return inspectionExport(inspections, buildInspectionReport(inspections));
		}
		case "compliance": {
			const extinguishers = await fetchExtinguishers(cookie);
			return complianceExport(buildComplianceReport(extinguishers));
		}
		case "maintenance": {
			const maintenance = await fetchMaintenance(cookie);
			return maintenanceExport(buildMaintenanceReport(maintenance));
		}
	}
};

const todayStamp = (): string => new Date().toISOString().slice(0, 10);

/**
 * Real-time reporting. Each report is computed on demand by aggregating live
 * data from the management service (the caller's cookie is forwarded). Every
 * report can also be exported as PDF or CSV.
 */
export const createReportsRouter = (): Router => {
	const router = Router();

	router.use(requireAuth);

	router.get(
		"/inventory",
		asyncHandler(async (req, res) => {
			const extinguishers = await fetchExtinguishers(req.headers.cookie);
			res.json({ report: buildInventoryReport(extinguishers) });
		}),
	);

	router.get(
		"/inspections",
		asyncHandler(async (req, res) => {
			const inspections = await fetchInspections(req.headers.cookie);
			res.json({ report: buildInspectionReport(inspections) });
		}),
	);

	router.get(
		"/compliance",
		asyncHandler(async (req, res) => {
			const { windowDays } = parse(windowQuerySchema, req.query);
			const extinguishers = await fetchExtinguishers(req.headers.cookie);
			res.json({ report: buildComplianceReport(extinguishers, windowDays) });
		}),
	);

	router.get(
		"/maintenance",
		asyncHandler(async (req, res) => {
			const { recentDays } = parse(recentQuerySchema, req.query);
			const maintenance = await fetchMaintenance(req.headers.cookie);
			res.json({ report: buildMaintenanceReport(maintenance, recentDays) });
		}),
	);

	router.get(
		"/:type/export",
		asyncHandler(async (req, res) => {
			const type = req.params.type;
			if (
				typeof type !== "string" ||
				!REPORT_TYPES.includes(type as ReportType)
			) {
				throw new ApiError({
					code: "NOT_FOUND",
					message: `Unknown report type. Expected one of: ${REPORT_TYPES.join(", ")}`,
				});
			}
			const { format } = parse(exportQuerySchema, req.query);

			const data = await buildExport(type as ReportType, req.headers.cookie);
			const filename = `${type}-report-${todayStamp()}`;

			if (format === "csv") {
				res.setHeader("Content-Type", "text/csv; charset=utf-8");
				res.setHeader(
					"Content-Disposition",
					`attachment; filename="${filename}.csv"`,
				);
				res.send(toCsv(data.csvRows, data.csvColumns));
				return;
			}

			const pdf = await renderReportPdf(data.pdf);
			res.setHeader("Content-Type", "application/pdf");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="${filename}.pdf"`,
			);
			res.send(pdf);
		}),
	);

	return router;
};
