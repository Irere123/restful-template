/**
 * Client-side mirrors of the JSON shapes the API gateway returns. These match
 * the backend Zod/Drizzle schemas; dates arrive as strings over the wire
 * (calendar dates as `YYYY-MM-DD`, timestamps as ISO-8601).
 */

// ── Auth & users ────────────────────────────────────────────────────────────

export const USER_ROLES = ["user", "inspector", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
	id: string;
	username: string | null;
	firstName: string;
	lastName: string;
	displayName: string;
	email: string;
	role: UserRole;
	emailVerified: string | null;
	refreshTokenVersion: number;
	createdAt: string;
	updatedAt: string;
}

export interface RegisterInput {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
}

export interface LoginInput {
	email: string;
	password: string;
}

export interface UpdateProfileInput {
	firstName?: string;
	lastName?: string;
	username?: string;
}

export interface ChangePasswordInput {
	currentPassword: string;
	newPassword: string;
}

export interface ResetPasswordInput {
	email: string;
	code: string;
	newPassword: string;
}

// ── Extinguishers ───────────────────────────────────────────────────────────

export const EXTINGUISHER_TYPES = [
	"water",
	"co2",
	"foam",
	"dry_chemical",
] as const;
export type ExtinguisherType = (typeof EXTINGUISHER_TYPES)[number];

export const EXTINGUISHER_SIZES = ["2.5lb", "5lb", "9lb", "12lb"] as const;
export type ExtinguisherSize = (typeof EXTINGUISHER_SIZES)[number];

export const EXTINGUISHER_STATUSES = [
	"active",
	"maintenance",
	"expired",
	"decommissioned",
] as const;
export type ExtinguisherStatus = (typeof EXTINGUISHER_STATUSES)[number];

export interface Extinguisher {
	id: string;
	serialNumber: string;
	location: string;
	type: ExtinguisherType;
	size: ExtinguisherSize;
	installationDate: string;
	expiryDate: string;
	status: ExtinguisherStatus;
	createdBy: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateExtinguisherInput {
	serialNumber: string;
	location: string;
	type: ExtinguisherType;
	size: ExtinguisherSize;
	installationDate: string;
	expiryDate: string;
	status?: ExtinguisherStatus;
}

export type UpdateExtinguisherInput = Partial<CreateExtinguisherInput>;

export type ListExtinguishersFilters = {
	status?: ExtinguisherStatus;
	type?: ExtinguisherType;
};

// ── Inspections ─────────────────────────────────────────────────────────────

export const INSPECTION_STATUSES = [
	"scheduled",
	"completed",
	"cancelled",
] as const;
export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const INSPECTION_RESULTS = [
	"pass",
	"fail",
	"needs_maintenance",
] as const;
export type InspectionResult = (typeof INSPECTION_RESULTS)[number];

export interface Inspection {
	id: string;
	extinguisherId: string;
	scheduledDate: string;
	scheduledTime: string | null;
	status: InspectionStatus;
	result: InspectionResult | null;
	notes: string | null;
	scheduledBy: string | null;
	inspectorId: string | null;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ScheduleInspectionInput {
	extinguisherId: string;
	scheduledDate: string;
	scheduledTime?: string;
	notes?: string;
	notifyEmail?: string;
}

export interface UpdateInspectionInput {
	scheduledDate?: string;
	scheduledTime?: string;
	status?: "scheduled" | "cancelled";
	notes?: string;
}

export interface CompleteInspectionInput {
	result: InspectionResult;
	notes?: string;
}

export type ListInspectionsFilters = {
	status?: InspectionStatus;
	extinguisherId?: string;
};

// ── Maintenance ─────────────────────────────────────────────────────────────

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

export interface CreateMaintenanceInput {
	extinguisherId: string;
	inspectionId?: string;
	actionTaken: string;
	maintenanceDate: string;
	issuesIdentified?: string;
	notes?: string;
	updateStatus?: ExtinguisherStatus;
}

// ── Reports ─────────────────────────────────────────────────────────────────

export type CountMap = Record<string, number>;

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
	complianceRate: number;
	windowDays: number;
	expired: ComplianceItem[];
	upcoming: ComplianceItem[];
}

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

export type ReportType =
	| "inventory"
	| "inspections"
	| "compliance"
	| "maintenance";
