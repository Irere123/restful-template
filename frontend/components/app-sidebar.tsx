"use client";

import {
	BellIcon,
	ChartColumnIcon,
	ClipboardCheckIcon,
	FireExtinguisherIcon,
	LayoutDashboardIcon,
	SettingsIcon,
	UsersIcon,
	WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brand } from "@/components/brand";
import { useAuth } from "@/components/providers/auth-provider";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/user-menu";

type NavItem = {
	title: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	adminOnly?: boolean;
};

const PRIMARY_NAV: NavItem[] = [
	{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
	{
		title: "Extinguishers",
		href: "/extinguishers",
		icon: FireExtinguisherIcon,
	},
	{ title: "Inspections", href: "/inspections", icon: ClipboardCheckIcon },
	{ title: "Maintenance", href: "/maintenance", icon: WrenchIcon },
	{ title: "Reports", href: "/reports", icon: ChartColumnIcon },
	{ title: "Alerts", href: "/notifications", icon: BellIcon },
];

const ADMIN_NAV: NavItem[] = [
	{ title: "Users", href: "/users", icon: UsersIcon, adminOnly: true },
];

const ACCOUNT_NAV: NavItem[] = [
	{ title: "Settings", href: "/settings", icon: SettingsIcon },
];

function NavMenu({ items }: { items: NavItem[] }): React.ReactElement {
	const pathname = usePathname();
	const { setOpenMobile, isMobile } = useSidebar();

	return (
		<SidebarMenu>
			{items.map((item) => {
				const active =
					pathname === item.href || pathname.startsWith(`${item.href}/`);
				return (
					<SidebarMenuItem key={item.href}>
						<SidebarMenuButton
							isActive={active}
							tooltip={item.title}
							onClick={() => isMobile && setOpenMobile(false)}
							render={<Link href={item.href} />}
						>
							<item.icon />
							<span>{item.title}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}

export function AppSidebar(): React.ReactElement {
	const { isAdmin } = useAuth();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<div className="flex h-10 items-center px-1 group-data-[collapsible=icon]:justify-center">
					<Brand className="group-data-[collapsible=icon]:hidden" />
					<Brand
						iconOnly
						className="hidden group-data-[collapsible=icon]:flex"
					/>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<NavMenu items={PRIMARY_NAV} />
					</SidebarGroupContent>
				</SidebarGroup>

				{isAdmin && (
					<SidebarGroup>
						<SidebarGroupLabel>Administration</SidebarGroupLabel>
						<SidebarGroupContent>
							<NavMenu items={ADMIN_NAV} />
						</SidebarGroupContent>
					</SidebarGroup>
				)}

				<SidebarGroup className="mt-auto">
					<SidebarGroupContent>
						<NavMenu items={ACCOUNT_NAV} />
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<UserMenu />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
