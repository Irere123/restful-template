"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Spinner } from "@/components/ui/spinner";

export default function Home(): React.ReactElement {
	const { isLoading, isAuthenticated } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (isLoading) return;
		router.replace(isAuthenticated ? "/dashboard" : "/auth/login");
	}, [isLoading, isAuthenticated, router]);

	return (
		<div className="flex flex-1 items-center justify-center">
			<Spinner className="size-5 text-muted-foreground" />
		</div>
	);
}
