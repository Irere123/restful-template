"use client";

import {
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import type {
	CompleteInspectionInput,
	Inspection,
	ListInspectionsFilters,
	ScheduleInspectionInput,
	UpdateInspectionInput,
} from "@/lib/api/types";

type ListResponse = { inspections: Inspection[] };
type OneResponse = { inspection: Inspection };

export function useInspections(
	filters?: ListInspectionsFilters,
): UseQueryResult<Inspection[]> {
	return useQuery({
		queryKey: queryKeys.inspections.list(filters),
		queryFn: async () => {
			const { inspections } = await apiFetch<ListResponse>("/inspections", {
				params: filters,
			});
			return inspections;
		},
	});
}

export function useInspection(
	id: string | undefined,
): UseQueryResult<Inspection> {
	return useQuery({
		queryKey: queryKeys.inspections.detail(id ?? ""),
		enabled: Boolean(id),
		queryFn: async () => {
			const { inspection } = await apiFetch<OneResponse>(`/inspections/${id}`);
			return inspection;
		},
	});
}

function invalidateInspections(qc: ReturnType<typeof useQueryClient>): void {
	qc.invalidateQueries({ queryKey: queryKeys.inspections.all });
	qc.invalidateQueries({ queryKey: queryKeys.reports.all });
}

export function useScheduleInspection() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: ScheduleInspectionInput) =>
			apiFetch<OneResponse>("/inspections", { method: "POST", body: input }),
		onSuccess: () => invalidateInspections(qc),
	});
}

export function useCompleteInspection() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			input,
		}: {
			id: string;
			input: CompleteInspectionInput;
		}) =>
			apiFetch<OneResponse>(`/inspections/${id}/complete`, {
				method: "POST",
				body: input,
			}),
		onSuccess: () => {
			invalidateInspections(qc);
			// Completing an inspection can flip an extinguisher's status.
			qc.invalidateQueries({ queryKey: queryKeys.extinguishers.all });
		},
	});
}

export function useUpdateInspection() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: UpdateInspectionInput }) =>
			apiFetch<OneResponse>(`/inspections/${id}`, {
				method: "PATCH",
				body: input,
			}),
		onSuccess: () => invalidateInspections(qc),
	});
}

export function useDeleteInspection() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) =>
			apiFetch<{ success: boolean }>(`/inspections/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => invalidateInspections(qc),
	});
}
