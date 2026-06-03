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
	CreateExtinguisherInput,
	Extinguisher,
	ListExtinguishersFilters,
	UpdateExtinguisherInput,
} from "@/lib/api/types";

type ListResponse = { extinguishers: Extinguisher[] };
type OneResponse = { extinguisher: Extinguisher };

export function useExtinguishers(
	filters?: ListExtinguishersFilters,
): UseQueryResult<Extinguisher[]> {
	return useQuery({
		queryKey: queryKeys.extinguishers.list(filters),
		queryFn: async () => {
			const { extinguishers } = await apiFetch<ListResponse>("/extinguishers", {
				params: filters,
			});
			return extinguishers;
		},
	});
}

export function useExtinguisher(
	id: string | undefined,
): UseQueryResult<Extinguisher> {
	return useQuery({
		queryKey: queryKeys.extinguishers.detail(id ?? ""),
		enabled: Boolean(id),
		queryFn: async () => {
			const { extinguisher } = await apiFetch<OneResponse>(
				`/extinguishers/${id}`,
			);
			return extinguisher;
		},
	});
}

function invalidateExtinguishers(qc: ReturnType<typeof useQueryClient>): void {
	qc.invalidateQueries({ queryKey: queryKeys.extinguishers.all });
	// Reports aggregate over extinguishers, so they go stale too.
	qc.invalidateQueries({ queryKey: queryKeys.reports.all });
}

export function useCreateExtinguisher() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateExtinguisherInput) =>
			apiFetch<OneResponse>("/extinguishers", { method: "POST", body: input }),
		onSuccess: () => invalidateExtinguishers(qc),
	});
}

export function useUpdateExtinguisher() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			input,
		}: {
			id: string;
			input: UpdateExtinguisherInput;
		}) =>
			apiFetch<OneResponse>(`/extinguishers/${id}`, {
				method: "PATCH",
				body: input,
			}),
		onSuccess: () => invalidateExtinguishers(qc),
	});
}

export function useDeleteExtinguisher() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) =>
			apiFetch<{ success: boolean }>(`/extinguishers/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => invalidateExtinguishers(qc),
	});
}
