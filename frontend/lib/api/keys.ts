/** Centralized React Query key factory — keeps cache keys consistent. */

import type {
	ListExtinguishersFilters,
	ListInspectionsFilters,
	ReportType,
} from "@/lib/api/types";

export const queryKeys = {
	me: ["me"] as const,

	users: {
		all: ["users"] as const,
		detail: (id: string) => ["users", id] as const,
	},

	extinguishers: {
		all: ["extinguishers"] as const,
		list: (filters?: ListExtinguishersFilters) =>
			["extinguishers", "list", filters ?? {}] as const,
		detail: (id: string) => ["extinguishers", id] as const,
	},

	inspections: {
		all: ["inspections"] as const,
		list: (filters?: ListInspectionsFilters) =>
			["inspections", "list", filters ?? {}] as const,
		detail: (id: string) => ["inspections", id] as const,
	},

	maintenance: {
		all: ["maintenance"] as const,
		list: (extinguisherId?: string) =>
			["maintenance", "list", extinguisherId ?? null] as const,
		detail: (id: string) => ["maintenance", id] as const,
	},

	reports: {
		all: ["reports"] as const,
		one: (type: ReportType, params?: Record<string, unknown>) =>
			["reports", type, params ?? {}] as const,
	},
};
