/**
 * Local shapes mirroring the JSON the management service returns. Reporting has
 * no database of its own; it aggregates these over HTTP. Dates arrive as
 * strings (calendar dates `YYYY-MM-DD`, timestamps ISO-8601).
 */

export interface Extinguisher {
	id: string;
	serialNumber: string;
	location: string;
	type: "water" | "co2" | "foam" | "dry_chemical";
	size: "2.5lb" | "5lb" | "9lb" | "12lb";
	installationDate: string;
	expiryDate: string;
	status: "active" | "maintenance" | "expired" | "decommissioned";
	createdBy: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Inspection {
	id: string;
	extinguisherId: string;
	scheduledDate: string;
	scheduledTime: string | null;
	status: "scheduled" | "completed" | "cancelled";
	result: "pass" | "fail" | "needs_maintenance" | null;
	notes: string | null;
	scheduledBy: string | null;
	inspectorId: string | null;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface MaintenanceLog {
	id: string;
	extinguisherId: string;
	inspectionId: string | null;
	actionTaken: string;
	maintenanceDate: string;
	issuesIdentified: string | null;
	notes: string | null;
	inspectorId: string | null;
	createdAt: string;
}
