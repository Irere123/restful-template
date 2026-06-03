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

// The reporting service wraps every report in `{ report: ... }`.
type ReportEnvelope<T> = { report: T };

export function useInventoryReport(): UseQueryResult<InventoryReport> {
  return useQuery({
    queryKey: queryKeys.reports.one("inventory"),
    queryFn: async () => {
      const { report } =
        await apiFetch<ReportEnvelope<InventoryReport>>("/reports/inventory");
      return report;
    },
  });
}

export function useInspectionReport(): UseQueryResult<InspectionReport> {
  return useQuery({
    queryKey: queryKeys.reports.one("inspections"),
    queryFn: async () => {
      const { report } =
        await apiFetch<ReportEnvelope<InspectionReport>>("/reports/inspections");
      return report;
    },
  });
}

export function useComplianceReport(
  windowDays = 30,
): UseQueryResult<ComplianceReport> {
  return useQuery({
    queryKey: queryKeys.reports.one("compliance", { windowDays }),
    queryFn: async () => {
      const { report } = await apiFetch<ReportEnvelope<ComplianceReport>>(
        "/reports/compliance",
        { params: { windowDays } },
      );
      return report;
    },
  });
}

export function useMaintenanceReport(
  recentDays = 30,
): UseQueryResult<MaintenanceReport> {
  return useQuery({
    queryKey: queryKeys.reports.one("maintenance", { recentDays }),
    queryFn: async () => {
      const { report } = await apiFetch<ReportEnvelope<MaintenanceReport>>(
        "/reports/maintenance",
        { params: { recentDays } },
      );
      return report;
    },
  });
}

/** Same-origin URL for a report export (opened in a new tab for download). */
export function reportExportUrl(
  type: ReportType,
  format: "pdf" | "csv",
): string {
  return apiUrl(`/reports/${type}/export`, { format });
}
