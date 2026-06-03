"use client";

import {
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import type { CreateManagedUserInput, User, UserRole } from "@/lib/api/types";

type ListResponse = { users: User[] };
type OneResponse = { user: User };
type CreateResponse = { user: User; resetEmailSent: boolean };

/** Admin-only: list every account. */
export function useUsers(): UseQueryResult<User[]> {
	return useQuery({
		queryKey: queryKeys.users.all,
		queryFn: async () => {
			const { users } = await apiFetch<ListResponse>("/users");
			return users;
		},
	});
}

export function useUpdateUserRole() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
			apiFetch<OneResponse>(`/users/${id}/role`, {
				method: "PATCH",
				body: { role },
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: queryKeys.users.all });
		},
	});
}

export function useCreateUser() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateManagedUserInput) =>
			apiFetch<CreateResponse>("/users", { method: "POST", body: input }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: queryKeys.users.all });
		},
	});
}

export function useDeleteUser() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) =>
			apiFetch<{ success: boolean }>(`/users/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: queryKeys.users.all });
		},
	});
}
