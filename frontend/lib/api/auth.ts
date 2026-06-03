"use client";

import {
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { ApiError, apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import type {
	ChangePasswordInput,
	LoginInput,
	RegisterInput,
	ResetPasswordInput,
	UpdateProfileInput,
	User,
} from "@/lib/api/types";

type UserResponse = { user: User };

export function useMe(): UseQueryResult<User | null> {
	return useQuery({
		queryKey: queryKeys.me,
		queryFn: async () => {
			try {
				const { user } = await apiFetch<UserResponse>("/auth/me");
				return user;
			} catch (err) {
				if (err instanceof ApiError && err.status === 401) return null;
				throw err;
			}
		},
		staleTime: 30_000,
		retry: false,
	});
}

export function useLogin() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: LoginInput) =>
			apiFetch<UserResponse>("/auth/login", { method: "POST", body: input }),
		onSuccess: ({ user }) => {
			qc.setQueryData(queryKeys.me, user);
		},
	});
}

export function useRegister() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: RegisterInput) =>
			apiFetch<UserResponse>("/auth/register", { method: "POST", body: input }),
		onSuccess: ({ user }) => {
			qc.setQueryData(queryKeys.me, user);
		},
	});
}

export function useLogout() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => apiFetch("/auth/logout", { method: "POST" }),
		onSuccess: () => {
			qc.setQueryData(queryKeys.me, null);
			qc.clear();
		},
	});
}

export function useLogoutAll() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => apiFetch("/auth/logout-all", { method: "POST" }),
		onSuccess: () => {
			qc.setQueryData(queryKeys.me, null);
			qc.clear();
		},
	});
}

export function useUpdateProfile() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateProfileInput) =>
			apiFetch<UserResponse>("/auth/me", { method: "PATCH", body: input }),
		onSuccess: ({ user }) => {
			qc.setQueryData(queryKeys.me, user);
		},
	});
}

export function useChangePassword() {
	return useMutation({
		mutationFn: (input: ChangePasswordInput) =>
			apiFetch<{ success: boolean }>("/auth/change-password", {
				method: "POST",
				body: input,
			}),
	});
}

export function useDeleteAccount() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => apiFetch("/auth/me", { method: "DELETE" }),
		onSuccess: () => {
			qc.setQueryData(queryKeys.me, null);
			qc.clear();
		},
	});
}

export function useVerifyEmail() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (code: string) =>
			apiFetch<UserResponse>("/auth/verify-email", {
				method: "POST",
				body: { code },
			}),
		onSuccess: ({ user }) => {
			qc.setQueryData(queryKeys.me, user);
		},
	});
}

export function useResendVerification() {
	return useMutation({
		mutationFn: () =>
			apiFetch<{ success: boolean }>("/auth/verify-email/resend", {
				method: "POST",
			}),
	});
}

export function useForgotPassword() {
	return useMutation({
		mutationFn: (email: string) =>
			apiFetch<{ success: boolean }>("/auth/forgot-password", {
				method: "POST",
				body: { email },
			}),
	});
}

export function useResetPassword() {
	return useMutation({
		mutationFn: (input: ResetPasswordInput) =>
			apiFetch<{ success: boolean }>("/auth/reset-password", {
				method: "POST",
				body: input,
			}),
	});
}
