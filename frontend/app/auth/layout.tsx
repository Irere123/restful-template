"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Brand } from "@/components/brand";
import { useAuth } from "@/components/providers/auth-provider";
import { Spinner } from "@/components/ui/spinner";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}): React.ReactElement {
	const { isAuthenticated, isLoading, user } = useAuth();
	const router = useRouter();

	// Signed-in users have no business on the auth screens — but let unverified
	// users reach the verify-email step.
	useEffect(() => {
		if (!isLoading && isAuthenticated && user?.emailVerified) {
			router.replace("/dashboard");
		}
	}, [isLoading, isAuthenticated, user?.emailVerified, router]);

	if (isLoading) {
		return (
			<div className="flex min-h-svh items-center justify-center">
				<Spinner className="size-5 text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-muted/30 px-4 py-12">
			<Brand />
			<main className="w-full max-w-sm">{children}</main>
			<p className="text-muted-foreground text-xs">
				© {new Date().getFullYear()} TZW LTD — Fire Extinguisher Management
			</p>
		</div>
	);
}
