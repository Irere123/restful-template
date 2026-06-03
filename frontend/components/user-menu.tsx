"use client";

import {
	ComputerRemoveIcon,
	Logout01Icon,
	Mail01Icon,
	Settings02Icon,
	UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Menu,
	MenuItem,
	MenuPopup,
	MenuSeparator,
	MenuTrigger,
} from "@/components/ui/menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useLogout, useLogoutAll } from "@/lib/api/auth";
import { toast } from "@/lib/toast";

function initials(first: string, last: string): string {
	return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "U";
}

export function UserMenu(): React.ReactElement | null {
	const { user } = useAuth();
	const router = useRouter();
	const logout = useLogout();
	const logoutAll = useLogoutAll();

	if (!user) return null;

	function signOut(all: boolean): void {
		const mutation = all ? logoutAll : logout;
		mutation.mutate(undefined, {
			onSuccess: () => {
				toast.success(all ? "Signed out of all devices" : "Signed out");
				router.replace("/auth/login");
			},
			onError: (err) => toast.fromError(err),
		});
	}

	return (
		<Menu>
			<MenuTrigger
				render={
					<SidebarMenuButton
						size="lg"
						className="data-[popup-open]:bg-sidebar-accent"
					/>
				}
			>
				<Avatar className="size-8 rounded-lg">
					<AvatarFallback className="rounded-lg text-xs">
						{initials(user.firstName, user.lastName)}
					</AvatarFallback>
				</Avatar>
				<div className="grid flex-1 text-left leading-tight">
					<span className="truncate font-medium text-sm">
						{user.displayName}
					</span>
					<span className="truncate text-muted-foreground text-xs">
						{user.email}
					</span>
				</div>
				<HugeiconsIcon
					icon={UnfoldMoreIcon}
					className="ms-auto size-4 opacity-70"
				/>
			</MenuTrigger>
			<MenuPopup align="end" side="top" className="w-60">
				<div className="flex items-center gap-2 px-2 py-1.5">
					<Avatar className="size-8 rounded-lg">
						<AvatarFallback className="rounded-lg text-xs">
							{initials(user.firstName, user.lastName)}
						</AvatarFallback>
					</Avatar>
					<div className="grid flex-1 leading-tight">
						<span className="truncate font-medium text-sm">
							{user.displayName}
						</span>
						<span className="truncate text-muted-foreground text-xs">
							{user.email}
						</span>
					</div>
				</div>
				<MenuSeparator />
				<MenuItem render={<Link href="/settings" />}>
					<HugeiconsIcon icon={Settings02Icon} />
					Account settings
				</MenuItem>
				{!user.emailVerified && (
					<MenuItem render={<Link href="/auth/verify-email" />}>
						<HugeiconsIcon icon={Mail01Icon} />
						Verify email
					</MenuItem>
				)}
				<MenuSeparator />
				<MenuItem onClick={() => signOut(false)}>
					<HugeiconsIcon icon={Logout01Icon} />
					Sign out
				</MenuItem>
				<MenuItem variant="destructive" onClick={() => signOut(true)}>
					<HugeiconsIcon icon={ComputerRemoveIcon} />
					Sign out all devices
				</MenuItem>
			</MenuPopup>
		</Menu>
	);
}
