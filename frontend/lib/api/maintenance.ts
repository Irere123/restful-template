"use client";

import {
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import type { CreateMaintenanceInput, MaintenanceLog } from "@/lib/api/types";

type ListResponse = { maintenance: MaintenanceLog[] };
type OneResponse = { maintenance: MaintenanceLog };

export function useMaintenanceLogs(
	extinguisherId?: string,
): UseQueryResult<MaintenanceLog[]> {
	return useQuery({
		queryKey: queryKeys.maintenance.list(extinguisherId),
		queryFn: async () => {
			const { maintenance } = await apiFetch<ListResponse>("/maintenance", {
				params: { extinguisherId },
			});
			return maintenance;
		},
	});
}

export function useCreateMaintenance() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateMaintenanceInput) =>
			apiFetch<OneResponse>("/maintenance", { method: "POST", body: input }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: queryKeys.maintenance.all });
			// A maintenance log can move an extinguisher's status; refresh both.
			qc.invalidateQueries({ queryKey: queryKeys.extinguishers.all });
			qc.invalidateQueries({ queryKey: queryKeys.reports.all });
		},
	});
}
