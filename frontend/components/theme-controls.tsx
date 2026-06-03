"use client";

import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
	Menu,
	MenuGroupLabel,
	MenuPopup,
	MenuRadioGroup,
	MenuRadioItem,
	MenuTrigger,
} from "@/components/ui/menu";
import { cn } from "@/lib/utils";

const themeOptions = [
	{ value: "light", label: "Light", icon: SunIcon },
	{ value: "dark", label: "Dark", icon: MoonIcon },
	{ value: "system", label: "System", icon: LaptopIcon },
] as const;

function subscribe(): () => void {
	return () => {};
}

function getClientSnapshot(): boolean {
	return true;
}

function getServerSnapshot(): boolean {
	return false;
}

function useMounted(): boolean {
	return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

export function ThemeSegmentedControl({
	className,
}: {
	className?: string;
}): React.ReactElement {
	const { theme, setTheme } = useTheme();
	const mounted = useMounted();

	const activeTheme = mounted ? (theme ?? "system") : "system";

	return (
		<div
			className={cn(
				"grid grid-cols-3 gap-1 rounded-lg border bg-muted/40 p-1",
				className,
			)}
		>
			{themeOptions.map((option) => {
				const Icon = option.icon;
				const active = activeTheme === option.value;
				return (
					<Button
						key={option.value}
						type="button"
						variant={active ? "default" : "ghost"}
						size="sm"
						className={cn(
							"h-9 justify-center shadow-none",
							!active && "text-muted-foreground",
						)}
						disabled={!mounted}
						onClick={() => setTheme(option.value)}
					>
						<Icon />
						{option.label}
					</Button>
				);
			})}
		</div>
	);
}

export function ThemeMenuRadioGroup(): React.ReactElement {
	const { theme, setTheme } = useTheme();
	const mounted = useMounted();

	return (
		<MenuRadioGroup
			value={mounted ? (theme ?? "system") : "system"}
			onValueChange={(value) => setTheme(value)}
		>
			<MenuGroupLabel>Theme</MenuGroupLabel>
			{themeOptions.map((option) => {
				const Icon = option.icon;
				return (
					<MenuRadioItem
						key={option.value}
						value={option.value}
						disabled={!mounted}
					>
						<span className="inline-flex items-center gap-2">
							<Icon className="size-4 opacity-80" />
							{option.label}
						</span>
					</MenuRadioItem>
				);
			})}
		</MenuRadioGroup>
	);
}

export function ThemeIconMenu(): React.ReactElement {
	const { theme, resolvedTheme } = useTheme();
	const mounted = useMounted();
	const activeTheme = mounted ? (theme ?? "system") : "system";
	const iconTheme = activeTheme === "system" ? resolvedTheme : activeTheme;
	const Icon = iconTheme === "dark" ? MoonIcon : SunIcon;

	return (
		<Menu>
			<MenuTrigger
				render={<Button variant="outline" size="icon" />}
				aria-label="Theme"
			>
				<Icon />
			</MenuTrigger>
			<MenuPopup align="end" className="w-44">
				<ThemeMenuRadioGroup />
			</MenuPopup>
		</Menu>
	);
}
