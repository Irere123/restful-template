"use client";

import type React from "react";
import {
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

import { ChartLegend, DonutChartTooltip } from "@/components/ui/chart-common";
import {
	AvailableChartColors,
	type ChartColor,
	constructCategoryColors,
	defaultValueFormatter,
	getColorValue,
	type ValueFormatter,
} from "@/lib/chart-utils";
import { cn } from "@/lib/utils";

export interface DonutChartProps {
	data: Record<string, string | number>[];
	/** Key on each datum holding the numeric value of the slice. */
	category: string;
	/** Key on each datum holding the slice label. */
	index: string;
	colors?: ChartColor[];
	valueFormatter?: ValueFormatter;
	variant?: "donut" | "pie";
	/** Show the centered total inside a donut. */
	showLabel?: boolean;
	/** Caption under the centered total (defaults to "Total"). */
	label?: string;
	showTooltip?: boolean;
	showLegend?: boolean;
	className?: string;
}

export function DonutChart({
	data,
	category,
	index,
	colors = AvailableChartColors,
	valueFormatter = defaultValueFormatter,
	variant = "donut",
	showLabel = true,
	label = "Total",
	showTooltip = true,
	showLegend = true,
	className,
}: DonutChartProps): React.ReactElement {
	const labels = data.map((d) => String(d[index]));
	const categoryColors = constructCategoryColors(labels, colors);
	const isDonut = variant === "donut";
	const total = data.reduce((sum, d) => sum + Number(d[category] ?? 0), 0);

	return (
		<div className={cn("flex size-full flex-col", className)}>
			<div className="relative min-h-0 grow">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
						<Pie
							data={data}
							dataKey={category}
							nameKey={index}
							innerRadius={isDonut ? "62%" : 0}
							outerRadius="100%"
							paddingAngle={isDonut ? 2 : 0}
							stroke="var(--color-card)"
							strokeWidth={1}
							isAnimationActive={false}
						>
							{data.map((d) => {
								const name = String(d[index]);
								return (
									<Cell
										key={name}
										fill={getColorValue(categoryColors.get(name) ?? "chart-1")}
									/>
								);
							})}
						</Pie>
						{showTooltip && (
							<Tooltip
								wrapperStyle={{ outline: "none" }}
								isAnimationActive={false}
								content={
									<DonutChartTooltip
										categoryColors={categoryColors}
										valueFormatter={valueFormatter}
									/>
								}
							/>
						)}
					</PieChart>
				</ResponsiveContainer>

				{isDonut && showLabel && (
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
						<span className="font-semibold text-2xl tabular-nums">
							{valueFormatter(total)}
						</span>
						<span className="text-muted-foreground text-xs">{label}</span>
					</div>
				)}
			</div>

			{showLegend && (
				<ChartLegend
					categories={labels}
					categoryColors={categoryColors}
					className="mt-3 justify-center"
				/>
			)}
		</div>
	);
}
