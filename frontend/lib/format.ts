/** Presentation helpers: human labels for enums and date formatting. */

import type {
	ExtinguisherStatus,
	ExtinguisherType,
	InspectionResult,
	InspectionStatus,
	UserRole,
} from "@/lib/api/types";

const TYPE_LABELS: Record<ExtinguisherType, string> = {
	water: "Water",
	co2: "CO₂",
	foam: "Foam",
	dry_chemical: "Dry chemical",
};

const STATUS_LABELS: Record<ExtinguisherStatus, string> = {
	active: "Active",
	maintenance: "Maintenance",
	expired: "Expired",
	decommissioned: "Decommissioned",
};

const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
	scheduled: "Scheduled",
	completed: "Completed",
	cancelled: "Cancelled",
};

const INSPECTION_RESULT_LABELS: Record<InspectionResult, string> = {
	pass: "Pass",
	fail: "Fail",
	needs_maintenance: "Needs maintenance",
};

const ROLE_LABELS: Record<UserRole, string> = {
	user: "User",
	inspector: "Inspector",
	admin: "Admin",
};

export const labelForType = (t: ExtinguisherType): string =>
	TYPE_LABELS[t] ?? t;
export const labelForStatus = (s: ExtinguisherStatus): string =>
	STATUS_LABELS[s] ?? s;
export const labelForInspectionStatus = (s: InspectionStatus): string =>
	INSPECTION_STATUS_LABELS[s] ?? s;
export const labelForInspectionResult = (r: InspectionResult): string =>
	INSPECTION_RESULT_LABELS[r] ?? r;
export const labelForRole = (r: UserRole): string => ROLE_LABELS[r] ?? r;

/** Turn `snake_case`/`camelCase` keys into Title Case for report breakdowns. */
export function humanize(key: string): string {
	const spaced = key.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Format a `YYYY-MM-DD` calendar date as e.g. "15 Jan 2026" (no timezone shift). */
export function formatDate(value: string | null | undefined): string {
	if (!value) return "—";
	const [y, m, d] = value.slice(0, 10).split("-").map(Number);
	if (!y || !m || !d) return value;
	const date = new Date(Date.UTC(y, m - 1, d));
	return date.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	});
}

/** Format an ISO timestamp as a date + time, e.g. "15 Jan 2026, 14:30". */
export function formatDateTime(value: string | null | undefined): string {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/** Today's calendar date as `YYYY-MM-DD` in local time (for date inputs). */
export function todayIso(): string {
	const d = new Date();
	const off = d.getTimezoneOffset() * 60000;
	return new Date(d.getTime() - off).toISOString().slice(0, 10);
}
