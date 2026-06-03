import type { PdfReportInput } from "@reporting/lib/pdf";
import type {
	ComplianceReport,
	InspectionReport,
	InventoryReport,
	MaintenanceReport,
} from "@reporting/lib/reports";
import type { Extinguisher, Inspection } from "@reporting/types";

export interface ReportExport {
	csvColumns: string[];
	csvRows: Array<Record<string, unknown>>;
	pdf: PdfReportInput;
}

const fmtMap = (m: Record<string, number>): string => {
	const entries = Object.entries(m);
	return entries.length ? entries.map(([k, v]) => `${k}=${v}`).join(", ") : "—";
};

export const inventoryExport = (
	extinguishers: Extinguisher[],
	report: InventoryReport,
): ReportExport => ({
	csvColumns: [
		"serialNumber",
		"location",
		"type",
		"size",
		"installationDate",
		"expiryDate",
		"status",
	],
	csvRows: extinguishers.map((e) => ({
		serialNumber: e.serialNumber,
		location: e.location,
		type: e.type,
		size: e.size,
		installationDate: e.installationDate,
		expiryDate: e.expiryDate,
		status: e.status,
	})),
	pdf: {
		title: "Inventory Report",
		subtitle: `Total extinguishers: ${report.total}`,
		summary: [
			["Total", report.total],
			["Installed today", report.installedToday],
			["Installed this month", report.installedThisMonth],
			["Installed this year", report.installedThisYear],
			["By type", fmtMap(report.byType)],
			["By size", fmtMap(report.bySize)],
			["By status", fmtMap(report.byStatus)],
		],
		tables: [
			{
				heading: "Extinguishers",
				columns: ["Serial", "Location", "Type", "Size", "Status", "Expiry"],
				rows: extinguishers.map((e) => [
					e.serialNumber,
					e.location,
					e.type,
					e.size,
					e.status,
					e.expiryDate,
				]),
			},
		],
	},
});

export const inspectionExport = (
	inspections: Inspection[],
	report: InspectionReport,
): ReportExport => {
	const overdue = new Set(report.items.overdue.map((i) => i.id));
	const bucketOf = (i: Inspection): string =>
		i.status === "completed"
			? "completed"
			: i.status === "cancelled"
				? "cancelled"
				: overdue.has(i.id)
					? "overdue"
					: "pending";

	return {
		csvColumns: [
			"id",
			"extinguisherId",
			"scheduledDate",
			"scheduledTime",
			"status",
			"bucket",
			"result",
			"completedAt",
		],
		csvRows: inspections.map((i) => ({
			id: i.id,
			extinguisherId: i.extinguisherId,
			scheduledDate: i.scheduledDate,
			scheduledTime: i.scheduledTime ?? "",
			status: i.status,
			bucket: bucketOf(i),
			result: i.result ?? "",
			completedAt: i.completedAt ?? "",
		})),
		pdf: {
			title: "Inspection Report",
			summary: [
				["Total", report.total],
				["Pending", report.pending],
				["Completed", report.completed],
				["Overdue", report.overdue],
				["Cancelled", report.cancelled],
			],
			tables: [
				{
					heading: "Inspections",
					columns: ["Extinguisher", "Scheduled", "Time", "Bucket", "Result"],
					rows: inspections.map((i) => [
						i.extinguisherId,
						i.scheduledDate,
						i.scheduledTime ?? "-",
						bucketOf(i),
						i.result ?? "-",
					]),
				},
			],
		},
	};
};

export const complianceExport = (report: ComplianceReport): ReportExport => ({
	csvColumns: [
		"serialNumber",
		"location",
		"expiryDate",
		"daysRemaining",
		"status",
		"category",
	],
	csvRows: [
		...report.expired.map((x) => ({
			serialNumber: x.serialNumber,
			location: x.location,
			expiryDate: x.expiryDate,
			daysRemaining: x.daysRemaining,
			status: x.status,
			category: "expired",
		})),
		...report.upcoming.map((x) => ({
			serialNumber: x.serialNumber,
			location: x.location,
			expiryDate: x.expiryDate,
			daysRemaining: x.daysRemaining,
			status: x.status,
			category: "upcoming",
		})),
	],
	pdf: {
		title: "Compliance Report",
		subtitle: `Compliance rate: ${report.complianceRate}%`,
		summary: [
			["Total", report.total],
			["Expired", report.expiredCount],
			["Upcoming expirations", report.upcomingCount],
			["Compliant", report.compliantCount],
			["Compliance rate", `${report.complianceRate}%`],
			["Window (days)", report.windowDays],
		],
		tables: [
			{
				heading: "Expired",
				columns: ["Serial", "Location", "Expiry", "Days overdue"],
				rows: report.expired.map((x) => [
					x.serialNumber,
					x.location,
					x.expiryDate,
					Math.abs(x.daysRemaining),
				]),
			},
			{
				heading: "Upcoming expirations",
				columns: ["Serial", "Location", "Expiry", "Days left"],
				rows: report.upcoming.map((x) => [
					x.serialNumber,
					x.location,
					x.expiryDate,
					x.daysRemaining,
				]),
			},
		],
	},
});

export const maintenanceExport = (report: MaintenanceReport): ReportExport => ({
	csvColumns: [
		"id",
		"extinguisherId",
		"actionTaken",
		"maintenanceDate",
		"issuesIdentified",
		"notes",
	],
	csvRows: report.history.map((m) => ({
		id: m.id,
		extinguisherId: m.extinguisherId,
		actionTaken: m.actionTaken,
		maintenanceDate: m.maintenanceDate,
		issuesIdentified: m.issuesIdentified ?? "",
		notes: m.notes ?? "",
	})),
	pdf: {
		title: "Maintenance Report",
		summary: [
			["Total records", report.total],
			[`Recent (last ${report.recentDays} days)`, report.recentCount],
		],
		tables: [
			{
				heading: "Maintenance frequency by extinguisher",
				columns: ["Extinguisher", "Count"],
				rows: report.frequencyByExtinguisher.map((f) => [
					f.extinguisherId,
					f.count,
				]),
			},
			{
				heading: "Recent maintenance",
				columns: ["Extinguisher", "Date", "Action"],
				rows: report.recent.map((m) => [
					m.extinguisherId,
					m.maintenanceDate,
					m.actionTaken,
				]),
			},
		],
	},
});
