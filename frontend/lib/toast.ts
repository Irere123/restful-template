"use client";

import { toastManager } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";

type ToastType = "success" | "error" | "info" | "warning";

function add(type: ToastType, title: string, description?: string): void {
	toastManager.add({ title, description, type });
}

/** Pull a readable message out of anything thrown by the API layer. */
export function errorMessage(err: unknown): string {
	if (err instanceof ApiError) return err.message;
	if (err instanceof Error) return err.message;
	return "Something went wrong. Please try again.";
}

export const toast = {
	success: (title: string, description?: string) =>
		add("success", title, description),
	error: (title: string, description?: string) =>
		add("error", title, description),
	info: (title: string, description?: string) =>
		add("info", title, description),
	warning: (title: string, description?: string) =>
		add("warning", title, description),
	/** Convenience for mutation `onError` handlers. */
	fromError: (err: unknown, title = "Something went wrong") =>
		add("error", title, errorMessage(err)),
};
