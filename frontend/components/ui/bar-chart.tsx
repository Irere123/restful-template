"use client";

import type React from "react";
import {
	Bar,
	CartesianGrid,
	BarChart as RechartsBarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { BarChartTooltip, ChartLegend } from "@/components/ui/chart-common";
import {
	AvailableChartColors,
	type ChartColor,
	constructCategoryColors,
	defaultValueFormatter,
	getColorValue,
	getYAxisDomain,
	type ValueFormatter,
} from "@/lib/chart-utils";
import { cn } from "@/lib/utils";

export interface BarChartProps {
	data: Record<string, string | number | null | undefined>[];
	/** Key on each datum holding the category label (the non-value axis). */
	index: string;
	/** Keys to plot as bar series. */
	categories: string[];
	colors?: ChartColor[];
	valueFormatter?: ValueFormatter;
	/** "horizontal" → vertical bars (default); "vertical" → horizontal bars. */
	layout?: "horizontal" | "vertical";
	stacked?: boolean;
	showLegend?: boolean;
	showGridLines?: boolean;
	showXAxis?: boolean;
	showYAxis?: boolean;
	yAxisWidth?: number;
	autoMinValue?: boolean;
	minValue?: number;
	maxValue?: number;
	className?: string;
}

export function BarChart({
	data,
	index,
	categories,
	colors = AvailableChartColors,
	valueFormatter = defaultValueFormatter,
	layout = "horizontal",
	stacked = false,
	showLegend = true,
	showGridLines = true,
	showXAxis = true,
	showYAxis = true,
	yAxisWidth = 48,
	autoMinValue = false,
	minValue,
	maxValue,
	className,
}: BarChartProps): React.ReactElement {
	const categoryColors = constructCategoryColors(categories, colors);
	const valueDomain = getYAxisDomain(autoMinValue, minValue, maxValue);
	const isVertical = layout === "vertical";

	const axisTick = { fill: "var(--color-muted-foreground)", fontSize: 12 };

	return (
		<div className={cn("flex size-full flex-col", className)}>
			<div className="min-h-0 grow">
				<ResponsiveContainer width="100%" height="100%">
					<RechartsBarChart
						data={data}
						layout={layout}
						margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
						barCategoryGap="20%"
					>
						{showGridLines && (
							<CartesianGrid
								stroke="var(--color-border)"
								strokeDasharray="3 3"
								horizontal={!isVertical}
								vertical={isVertical}
							/>
						)}

						<XAxis
							hide={!showXAxis}
							type={isVertical ? "number" : "category"}
							dataKey={isVertical ? undefined : index}
							domain={isVertical ? valueDomain : undefined}
							allowDecimals={false}
							tick={axisTick}
							tickLine={false}
							axisLine={false}
							interval="preserveStartEnd"
							minTickGap={5}
						/>

						<YAxis
							hide={!showYAxis}
							type={isVertical ? "category" : "number"}
							dataKey={isVertical ? index : undefined}
							domain={isVertical ? undefined : valueDomain}
							width={yAxisWidth}
							allowDecimals={false}
							tick={axisTick}
							tickLine={false}
							axisLine={false}
						/>

						<Tooltip
							cursor={{ fill: "var(--color-muted)" }}
							wrapperStyle={{ outline: "none" }}
							isAnimationActive={false}
							content={
								<BarChartTooltip
									categoryColors={categoryColors}
									valueFormatter={valueFormatter}
								/>
							}
						/>

						{categories.map((category) => (
							<Bar
								key={category}
								dataKey={category}
								stackId={stacked ? "stack" : undefined}
								fill={getColorValue(categoryColors.get(category) ?? "chart-1")}
								radius={
									stacked ? 0 : isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]
								}
								isAnimationActive={false}
							/>
						))}
					</RechartsBarChart>
				</ResponsiveContainer>
			</div>

			{showLegend && (
				<ChartLegend
					categories={categories}
					categoryColors={categoryColors}
					className="mt-3 justify-center"
				/>
			)}
		</div>
	);
}
