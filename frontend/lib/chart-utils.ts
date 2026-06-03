/**
 * Chart color + axis helpers, adapted from Tremor for this project's Tailwind v4
 * design system.
 *
 * Colors resolve to CSS variables rather than utility class names: the brand
 * `--chart-1..5` tokens (defined in globals.css) already swap between light and
 * dark mode, so charts re-theme automatically. Named colors fall back to
 * Tailwind v4's default palette variables (`--color-blue-500`, …) for the rare
 * case of more than five categories.
 */

export type ChartColor =
	| "chart-1"
	| "chart-2"
	| "chart-3"
	| "chart-4"
	| "chart-5"
	| "blue"
	| "emerald"
	| "amber"
	| "violet"
	| "rose";

const colorValues: Record<ChartColor, string> = {
	"chart-1": "var(--color-chart-1)",
	"chart-2": "var(--color-chart-2)",
	"chart-3": "var(--color-chart-3)",
	"chart-4": "var(--color-chart-4)",
	"chart-5": "var(--color-chart-5)",
	blue: "var(--color-blue-500)",
	emerald: "var(--color-emerald-500)",
	amber: "var(--color-amber-500)",
	violet: "var(--color-violet-500)",
	rose: "var(--color-rose-500)",
};

/** Default palette order — leads with the brand `--chart-*` tokens. */
export const AvailableChartColors: ChartColor[] = [
	"chart-1",
	"chart-2",
	"chart-3",
	"chart-4",
	"chart-5",
	"blue",
	"emerald",
	"amber",
	"violet",
	"rose",
];

/** Resolve a chart color to a CSS color value usable by recharts (fill/stroke). */
export function getColorValue(color: ChartColor): string {
	return colorValues[color] ?? colorValues["chart-1"];
}

/** Map each category to a palette color, cycling if there are more categories. */
export function constructCategoryColors(
	categories: string[],
	colors: ChartColor[],
): Map<string, ChartColor> {
	const map = new Map<string, ChartColor>();
	categories.forEach((category, index) => {
		map.set(category, colors[index % colors.length]);
	});
	return map;
}

/** Build a recharts numeric-axis domain from Tremor-style min/max props. */
export function getYAxisDomain(
	autoMinValue: boolean,
	minValue: number | undefined,
	maxValue: number | undefined,
): [number | string, number | string] {
	const min = autoMinValue ? "auto" : (minValue ?? 0);
	const max = maxValue ?? "auto";
	return [min, max];
}

export type ValueFormatter = (value: number) => string;

export const defaultValueFormatter: ValueFormatter = (value) =>
	Intl.NumberFormat("en-US").format(value).toString();
