import type {
	Extinguisher,
	Inspection,
	MaintenanceLog,
} from "@reporting/types";

/** Today's calendar date as `YYYY-MM-DD` (local time). */
const todayIso = (): string => {
	const d = new Date();
	const off = d.getTimezoneOffset() * 60000;
	return new Date(d.getTime() - off).toISOString().slice(0, 10);
};

/** Calendar date `n` days from today (negative = in the past), `YYYY-MM-DD`. */
const isoDaysFromNow = (days: number): string => {
	const d = new Date();
	d.setDate(d.getDate() + days);
	const off = d.getTimezoneOffset() * 60000;
	return new Date(d.getTime() - off).toISOString().slice(0, 10);
};

/** Whole days from `a` to `b` (both `YYYY-MM-DD`); negative if `b` is before `a`. */
const daysBetween = (a: string, b: string): number =>
	Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export type CountMap = Record<string, number>;

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export interface InventoryReport {
	generatedAt: string;
	total: number;
	byType: CountMap;
	bySize: CountMap;
	byStatus: CountMap;
	installedToday: number;
	installedThisMonth: number;
	installedThisYear: number;
}

export const buildInventoryReport = (
	extinguishers: Extinguisher[],
): InventoryReport => {
	const today = todayIso();
	const month = today.slice(0, 7);
	const year = today.slice(0, 4);

	const byType: CountMap = {};
	const bySize: CountMap = {};
	const byStatus: CountMap = {};
	let installedToday = 0;
	let installedThisMonth = 0;
	let installedThisYear = 0;

	for (const e of extinguishers) {
		byType[e.type] = (byType[e.type] ?? 0) + 1;
		bySize[e.size] = (bySize[e.size] ?? 0) + 1;
		byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
		if (e.installationDate === today) installedToday++;
		if (e.installationDate.slice(0, 7) === month) installedThisMonth++;
		if (e.installationDate.slice(0, 4) === year) installedThisYear++;
	}

	return {
		generatedAt: new Date().toISOString(),
		total: extinguishers.length,
		byType,
		bySize,
		byStatus,
		installedToday,
		installedThisMonth,
		installedThisYear,
	};
};

// ---------------------------------------------------------------------------
// Inspections
// ---------------------------------------------------------------------------

export interface InspectionReport {
	generatedAt: string;
	total: number;
	pending: number;
	completed: number;
	overdue: number;
	cancelled: number;
	items: {
		pending: Inspection[];
		completed: Inspection[];
		overdue: Inspection[];
	};
}

export const buildInspectionReport = (
	inspections: Inspection[],
): InspectionReport => {
	const today = todayIso();
	const pending: Inspection[] = [];
	const completed: Inspection[] = [];
	const overdue: Inspection[] = [];
	let cancelled = 0;

	for (const i of inspections) {
		if (i.status === "completed") {
			completed.push(i);
		} else if (i.status === "cancelled") {
			cancelled++;
		} else if (i.scheduledDate < today) {
			overdue.push(i);
		} else {
			pending.push(i);
		}
	}

	return {
		generatedAt: new Date().toISOString(),
		total: inspections.length,
		pending: pending.length,
		completed: completed.length,
		overdue: overdue.length,
		cancelled,
		items: { pending, completed, overdue },
	};
};

// ---------------------------------------------------------------------------
// Compliance
// ---------------------------------------------------------------------------

export interface ComplianceItem {
	id: string;
	serialNumber: string;
	location: string;
	expiryDate: string;
	daysRemaining: number;
	status: string;
}

export interface ComplianceReport {
	generatedAt: string;
	total: number;
	expiredCount: number;
	upcomingCount: number;
	compliantCount: number;
	/** Percentage of units not expired, to one decimal place. */
	complianceRate: number;
	windowDays: number;
	expired: ComplianceItem[];
	upcoming: ComplianceItem[];
}

export const buildComplianceReport = (
	extinguishers: Extinguisher[],
	windowDays = 30,
): ComplianceReport => {
	const today = todayIso();
	const horizon = isoDaysFromNow(windowDays);
	const expired: ComplianceItem[] = [];
	const upcoming: ComplianceItem[] = [];

	for (const e of extinguishers) {
		const item: ComplianceItem = {
			id: e.id,
			serialNumber: e.serialNumber,
			location: e.location,
			expiryDate: e.expiryDate,
			daysRemaining: daysBetween(today, e.expiryDate),
			status: e.status,
		};
		if (e.expiryDate < today || e.status === "expired") {
			expired.push(item);
		} else if (e.expiryDate <= horizon) {
			upcoming.push(item);
		}
	}

	const total = extinguishers.length;
	const compliantCount = total - expired.length;
	const complianceRate =
		total === 0 ? 100 : Math.round((compliantCount / total) * 1000) / 10;

	return {
		generatedAt: new Date().toISOString(),
		total,
		expiredCount: expired.length,
		upcomingCount: upcoming.length,
		compliantCount,
		complianceRate,
		windowDays,
		expired,
		upcoming,
	};
};

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

export interface FrequencyItem {
	extinguisherId: string;
	count: number;
}

export interface MaintenanceReport {
	generatedAt: string;
	total: number;
	recentCount: number;
	recentDays: number;
	recent: MaintenanceLog[];
	frequencyByExtinguisher: FrequencyItem[];
	history: MaintenanceLog[];
}

export const buildMaintenanceReport = (
	logs: MaintenanceLog[],
	recentDays = 30,
): MaintenanceReport => {
	const since = isoDaysFromNow(-recentDays);
	const recent = logs.filter((l) => l.maintenanceDate >= since);

	const freq = new Map<string, number>();
	for (const l of logs) {
		freq.set(l.extinguisherId, (freq.get(l.extinguisherId) ?? 0) + 1);
	}
	const frequencyByExtinguisher: FrequencyItem[] = [...freq.entries()]
		.map(([extinguisherId, count]) => ({ extinguisherId, count }))
		.sort((a, b) => b.count - a.count);

	return {
		generatedAt: new Date().toISOString(),
		total: logs.length,
		recentCount: recent.length,
		recentDays,
		recent,
		frequencyByExtinguisher,
		history: logs,
	};
};
