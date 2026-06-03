"use client";

import type React from "react";

import {
	type ChartColor,
	getColorValue,
	type ValueFormatter,
} from "@/lib/chart-utils";
import { cn } from "@/lib/utils";

function Swatch({ color }: { color: ChartColor }): React.ReactElement {
	return (
		<span
			className="size-2.5 shrink-0 rounded-[3px]"
			style={{ backgroundColor: getColorValue(color) }}
		/>
	);
}

export function ChartLegend({
	categories,
	categoryColors,
	className,
}: {
	categories: string[];
	categoryColors: Map<string, ChartColor>;
	className?: string;
}): React.ReactElement {
	return (
		<ol
			className={cn(
				"flex flex-wrap items-center gap-x-4 gap-y-1.5",
				className,
			)}
		>
			{categories.map((category) => (
				<li
					key={category}
					className="flex items-center gap-2 text-muted-foreground text-sm"
				>
					<Swatch color={categoryColors.get(category) ?? "chart-1"} />
					<span className="truncate">{category}</span>
				</li>
			))}
		</ol>
	);
}

export function ChartPlaceholder({
	loading,
}: {
	loading?: boolean;
}): React.ReactElement {
	return (
		<div className="flex size-full items-center justify-center text-muted-foreground text-sm">
			{loading ? "Loading…" : "No data"}
		</div>
	);
}

function TooltipFrame({
	children,
}: {
	children: React.ReactNode;
}): React.ReactElement {
	return (
		<div className="rounded-lg border bg-popover text-popover-foreground shadow-md">
			{children}
		</div>
	);
}

function TooltipRow({
	color,
	name,
	value,
}: {
	color: ChartColor;
	name: string;
	value: string;
}): React.ReactElement {
	return (
		<div className="flex items-center justify-between gap-6 text-sm">
			<span className="flex items-center gap-2">
				<Swatch color={color} />
				<span className="text-muted-foreground">{name}</span>
			</span>
			<span className="font-medium text-foreground tabular-nums">{value}</span>
		</div>
	);
}

// recharts injects `active`, `payload` and `label` when this element is passed
// as a Tooltip `content`. The payload item shape is narrowed to what we read.
type RechartsTooltipItem = {
	dataKey?: string | number;
	name?: string | number;
	value?: number | string;
};

export function BarChartTooltip({
	active,
	payload,
	label,
	categoryColors,
	valueFormatter,
}: {
	active?: boolean;
	payload?: RechartsTooltipItem[];
	label?: React.ReactNode;
	categoryColors: Map<string, ChartColor>;
	valueFormatter: ValueFormatter;
}): React.ReactElement | null {
	if (!active || !payload?.length) return null;
	return (
		<TooltipFrame>
			{label != null && label !== "" && (
				<p className="border-b px-3 py-2 font-medium text-foreground text-xs">
					{label}
				</p>
			)}
			<div className="space-y-1.5 px-3 py-2">
				{payload.map((item, i) => {
					const name = String(item.dataKey ?? item.name ?? i);
					return (
						<TooltipRow
							key={name}
							color={categoryColors.get(name) ?? "chart-1"}
							name={name}
							value={valueFormatter(Number(item.value ?? 0))}
						/>
					);
				})}
			</div>
		</TooltipFrame>
	);
}

export function DonutChartTooltip({
	active,
	payload,
	categoryColors,
	valueFormatter,
}: {
	active?: boolean;
	payload?: RechartsTooltipItem[];
	categoryColors: Map<string, ChartColor>;
	valueFormatter: ValueFormatter;
}): React.ReactElement | null {
	if (!active || !payload?.length) return null;
	const item = payload[0];
	const name = String(item.name ?? "");
	return (
		<TooltipFrame>
			<div className="px-3 py-2">
				<TooltipRow
					color={categoryColors.get(name) ?? "chart-1"}
					name={name}
					value={valueFormatter(Number(item.value ?? 0))}
				/>
			</div>
		</TooltipFrame>
	);
}
