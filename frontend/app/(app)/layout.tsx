"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/components/providers/auth-provider";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { VerifyEmailBanner } from "@/components/verify-email-banner";

const SECTION_TITLES: Record<string, string> = {
	"/dashboard": "Dashboard",
	"/extinguishers": "Extinguishers",
	"/inspections": "Inspections",
	"/maintenance": "Maintenance",
	"/reports": "Reports",
	"/notifications": "Alerts",
	"/users": "Users",
	"/settings": "Settings",
};

function sectionTitle(pathname: string): string {
	const match = Object.keys(SECTION_TITLES).find(
		(href) => pathname === href || pathname.startsWith(`${href}/`),
	);
	return match ? SECTION_TITLES[match] : "TZW Fire Safety";
}

export default function AppLayout({
	children,
}: {
	children: React.ReactNode;
}): React.ReactElement {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			const redirect = encodeURIComponent(pathname);
			router.replace(`/auth/login?redirect=${redirect}`);
		}
	}, [isLoading, isAuthenticated, pathname, router]);

	if (isLoading || !isAuthenticated) {
		return (
			<div className="flex min-h-svh items-center justify-center">
				<Spinner className="size-5 text-muted-foreground" />
			</div>
		);
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
					<SidebarTrigger className="md:hidden" />
					<Separator orientation="vertical" className="h-5 md:hidden" />
					<span className="font-heading font-semibold text-sm">
						{sectionTitle(pathname)}
					</span>
				</header>
				<div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
					<VerifyEmailBanner />
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
