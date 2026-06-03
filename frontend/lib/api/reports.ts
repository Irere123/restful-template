"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { apiFetch, apiUrl } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import type {
	ComplianceReport,
	InspectionReport,
	InventoryReport,
	MaintenanceReport,
	ReportType,
} from "@/lib/api/types";

export function useInventoryReport(): UseQueryResult<InventoryReport> {
	return useQuery({
		queryKey: queryKeys.reports.one("inventory"),
		queryFn: () => apiFetch<InventoryReport>("/reports/inventory"),
	});
}

export function useInspectionReport(): UseQueryResult<InspectionReport> {
	return useQuery({
		queryKey: queryKeys.reports.one("inspections"),
		queryFn: () => apiFetch<InspectionReport>("/reports/inspections"),
	});
}

export function useComplianceReport(
	windowDays = 30,
): UseQueryResult<ComplianceReport> {
	return useQuery({
		queryKey: queryKeys.reports.one("compliance", { windowDays }),
		queryFn: () =>
			apiFetch<ComplianceReport>("/reports/compliance", {
				params: { windowDays },
			}),
	});
}

export function useMaintenanceReport(
	recentDays = 30,
): UseQueryResult<MaintenanceReport> {
	return useQuery({
		queryKey: queryKeys.reports.one("maintenance", { recentDays }),
		queryFn: () =>
			apiFetch<MaintenanceReport>("/reports/maintenance", {
				params: { recentDays },
			}),
	});
}

/** Same-origin URL for a report export (opened in a new tab for download). */
export function reportExportUrl(
	type: ReportType,
	format: "pdf" | "csv",
): string {
	return apiUrl(`/reports/${type}/export`, { format });
}
