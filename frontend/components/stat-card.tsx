import type React from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "destructive" | "info";

const TONE_CLASSES: Record<Tone, string> = {
	default: "bg-muted text-foreground",
	success: "bg-success/10 text-success",
	warning: "bg-warning/10 text-warning",
	destructive: "bg-destructive/10 text-destructive",
	info: "bg-info/10 text-info",
};

export function StatCard({
	label,
	value,
	hint,
	icon,
	tone = "default",
	loading = false,
}: {
	label: string;
	value: React.ReactNode;
	hint?: string;
	icon?: React.ReactNode;
	tone?: Tone;
	loading?: boolean;
}): React.ReactElement {
	return (
		<Card className="p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<p className="truncate text-muted-foreground text-sm">{label}</p>
					{loading ? (
						<Skeleton className="h-7 w-16" />
					) : (
						<p className="font-heading font-semibold text-2xl tabular-nums leading-none">
							{value}
						</p>
					)}
					{hint && <p className="text-muted-foreground text-xs">{hint}</p>}
				</div>
				{icon && (
					<span
						className={cn(
							"flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4.5",
							TONE_CLASSES[tone],
						)}
					>
						{icon}
					</span>
				)}
			</div>
		</Card>
	);
}
