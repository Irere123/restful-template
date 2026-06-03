"use client";

import {
	environmentManager,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";

import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";

function makeQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				refetchOnWindowFocus: false,
				retry: (failureCount, error) => {
					// Don't hammer the server on auth/permission/validation failures.
					if (error instanceof ApiError && error.status < 500) return false;
					return failureCount < 2;
				},
			},
		},
	});
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
	// On the server, always make a fresh client; in the browser, reuse one so the
	// cache survives re-renders.
	if (environmentManager.isServer()) return makeQueryClient();
	browserQueryClient ??= makeQueryClient();
	return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(getQueryClient);

	return (
		<QueryClientProvider client={queryClient}>
			<ToastProvider>
				<AuthProvider>{children}</AuthProvider>
			</ToastProvider>
		</QueryClientProvider>
	);
}
