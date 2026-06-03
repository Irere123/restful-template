"use client";

import {
	ChartBarBigIcon,
	ClipboardCheckIcon,
	DashboardSquare01Icon,
	FireExtinguisherIcon,
	Notification03Icon,
	UserMultipleIcon,
	Wrench01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
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
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/user-menu";

type NavItem = {
	title: string;
	href: string;
	icon: IconSvgElement;
	adminOnly?: boolean;
};

const PRIMARY_NAV: NavItem[] = [
	{ title: "Dashboard", href: "/dashboard", icon: DashboardSquare01Icon },
	{
		title: "Extinguishers",
		href: "/extinguishers",
		icon: FireExtinguisherIcon,
	},
	{ title: "Inspections", href: "/inspections", icon: ClipboardCheckIcon },
	{ title: "Maintenance", href: "/maintenance", icon: Wrench01Icon },
	{ title: "Reports", href: "/reports", icon: ChartBarBigIcon },
	{ title: "Alerts", href: "/notifications", icon: Notification03Icon },
];

const ADMIN_NAV: NavItem[] = [
	{ title: "Users", href: "/users", icon: UserMultipleIcon, adminOnly: true },
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
							<HugeiconsIcon icon={item.icon} />
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
				<div className="flex h-10 items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
					<Brand
						showSubtitle={false}
						className="group-data-[collapsible=icon]:hidden"
					/>
					<SidebarTrigger className="ms-auto group-data-[collapsible=icon]:ms-0" />
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
