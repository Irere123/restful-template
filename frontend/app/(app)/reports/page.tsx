"use client";

import { DownloadIcon, FileTextIcon } from "lucide-react";
import { useMemo } from "react";

import { DataState } from "@/components/data-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { BarChart } from "@/components/ui/bar-chart";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { DonutChart } from "@/components/ui/donut-chart";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { useExtinguishers } from "@/lib/api/extinguishers";
import {
	reportExportUrl,
	useComplianceReport,
	useInspectionReport,
	useInventoryReport,
	useMaintenanceReport,
} from "@/lib/api/reports";
import type { CountMap, ReportType } from "@/lib/api/types";
import { formatDate, humanize } from "@/lib/format";

function ExportButtons({ type }: { type: ReportType }): React.ReactElement {
	return (
		<div className="flex justify-end gap-2">
			<Button
				variant="outline"
				size="sm"
				render={
					<a
						href={reportExportUrl(type, "pdf")}
						target="_blank"
						rel="noreferrer"
					/>
				}
			>
				<FileTextIcon />
				PDF
			</Button>
			<Button
				variant="outline"
				size="sm"
				render={
					<a
						href={reportExportUrl(type, "csv")}
						target="_blank"
						rel="noreferrer"
					/>
				}
			>
				<DownloadIcon />
				CSV
			</Button>
		</div>
	);
}

/** Convert a `{ key: count }` map into recharts data under a named series key. */
function seriesData(
	counts: CountMap,
	key: string,
): Record<string, string | number>[] {
	return Object.entries(counts).map(([name, value]) => ({
		name: humanize(name),
		[key]: value,
	}));
}

function ChartCard({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}): React.ReactElement {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{title}</CardTitle>
			</CardHeader>
			<CardPanel>
				<div className="h-60">{children}</div>
			</CardPanel>
		</Card>
	);
}

function InventoryTab(): React.ReactElement {
	const q = useInventoryReport();
	return (
		<DataState
			isLoading={q.isLoading}
			isError={q.isError}
			error={q.error}
			onRetry={() => q.refetch()}
		>
			{q.data && (
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
						<StatCard label="Total units" value={q.data.total} />
						<StatCard label="Installed today" value={q.data.installedToday} />
						<StatCard label="This month" value={q.data.installedThisMonth} />
						<StatCard label="This year" value={q.data.installedThisYear} />
					</div>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<ChartCard title="By type">
							<DonutChart
								data={seriesData(q.data.byType, "value")}
								category="value"
								index="name"
							/>
						</ChartCard>
						<ChartCard title="By size">
							<BarChart
								data={seriesData(q.data.bySize, "Units")}
								index="name"
								categories={["Units"]}
								showLegend={false}
							/>
						</ChartCard>
						<ChartCard title="By status">
							<DonutChart
								data={seriesData(q.data.byStatus, "value")}
								category="value"
								index="name"
							/>
						</ChartCard>
					</div>
				</div>
			)}
		</DataState>
	);
}

function InspectionsTab(): React.ReactElement {
	const q = useInspectionReport();
	return (
		<DataState
			isLoading={q.isLoading}
			isError={q.isError}
			error={q.error}
			onRetry={() => q.refetch()}
		>
			{q.data && (
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
						<StatCard label="Total" value={q.data.total} />
						<StatCard label="Pending" value={q.data.pending} tone="info" />
						<StatCard
							label="Completed"
							value={q.data.completed}
							tone="success"
						/>
						<StatCard
							label="Overdue"
							value={q.data.overdue}
							tone={q.data.overdue > 0 ? "warning" : "default"}
						/>
						<StatCard label="Cancelled" value={q.data.cancelled} />
					</div>
					<ChartCard title="Inspections by state">
						<BarChart
							data={[
								{ name: "Pending", Inspections: q.data.pending },
								{ name: "Completed", Inspections: q.data.completed },
								{ name: "Overdue", Inspections: q.data.overdue },
								{ name: "Cancelled", Inspections: q.data.cancelled },
							]}
							index="name"
							categories={["Inspections"]}
							showLegend={false}
						/>
					</ChartCard>
				</div>
			)}
		</DataState>
	);
}

function ComplianceTab(): React.ReactElement {
	const q = useComplianceReport();
	return (
		<DataState
			isLoading={q.isLoading}
			isError={q.isError}
			error={q.error}
			onRetry={() => q.refetch()}
		>
			{q.data && (
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
						<StatCard
							label="Compliance rate"
							value={`${q.data.complianceRate}%`}
							tone="info"
						/>
						<StatCard
							label="Compliant"
							value={q.data.compliantCount}
							tone="success"
						/>
						<StatCard
							label="Expired"
							value={q.data.expiredCount}
							tone={q.data.expiredCount > 0 ? "destructive" : "default"}
						/>
						<StatCard
							label={`Expiring (${q.data.windowDays}d)`}
							value={q.data.upcomingCount}
							tone={q.data.upcomingCount > 0 ? "warning" : "default"}
						/>
					</div>

					<ChartCard title="Compliance breakdown">
						<DonutChart
							data={[
								{ name: "Compliant", value: q.data.compliantCount },
								{ name: "Expired", value: q.data.expiredCount },
								{ name: "Expiring", value: q.data.upcomingCount },
							]}
							category="value"
							index="name"
							colors={["emerald", "rose", "amber"]}
						/>
					</ChartCard>

					{(q.data.expired.length > 0 || q.data.upcoming.length > 0) && (
						<Card className="overflow-hidden rounded-lg">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Serial</TableHead>
										<TableHead>Location</TableHead>
										<TableHead>Expiry</TableHead>
										<TableHead>Days remaining</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{[...q.data.expired, ...q.data.upcoming].map((item) => (
										<TableRow key={item.id}>
											<TableCell className="font-medium">
												{item.serialNumber}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{item.location}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{formatDate(item.expiryDate)}
											</TableCell>
											<TableCell
												className={
													item.daysRemaining < 0
														? "font-medium text-destructive-foreground"
														: "text-muted-foreground"
												}
											>
												{item.daysRemaining < 0
													? `${Math.abs(item.daysRemaining)} days overdue`
													: `${item.daysRemaining} days`}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Card>
					)}
				</div>
			)}
		</DataState>
	);
}

function MaintenanceTab(): React.ReactElement {
	const q = useMaintenanceReport();
	const extinguishers = useExtinguishers();
	const serialById = useMemo(() => {
		const map = new Map<string, string>();
		for (const e of extinguishers.data ?? []) map.set(e.id, e.serialNumber);
		return map;
	}, [extinguishers.data]);
	const topServiced = (q.data?.frequencyByExtinguisher ?? [])
		.slice(0, 8)
		.map((f) => ({
			name: serialById.get(f.extinguisherId) ?? f.extinguisherId.slice(0, 8),
			Services: f.count,
		}));
	return (
		<DataState
			isLoading={q.isLoading}
			isError={q.isError}
			error={q.error}
			onRetry={() => q.refetch()}
		>
			{q.data && (
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
						<StatCard label="Total records" value={q.data.total} />
						<StatCard
							label={`Recent (${q.data.recentDays}d)`}
							value={q.data.recentCount}
						/>
						<StatCard
							label="Units serviced"
							value={q.data.frequencyByExtinguisher.length}
						/>
					</div>
					{topServiced.length > 0 && (
						<ChartCard title="Most serviced units">
							<BarChart
								data={topServiced}
								index="name"
								categories={["Services"]}
								layout="vertical"
								yAxisWidth={96}
								showLegend={false}
							/>
						</ChartCard>
					)}
					{q.data.frequencyByExtinguisher.length > 0 && (
						<Card className="overflow-hidden rounded-lg">
							<CardHeader>
								<CardTitle className="text-base">
									Most frequently serviced
								</CardTitle>
							</CardHeader>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Extinguisher ID</TableHead>
										<TableHead>Maintenance count</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{q.data.frequencyByExtinguisher.slice(0, 10).map((f) => (
										<TableRow key={f.extinguisherId}>
											<TableCell className="font-mono text-xs">
												{f.extinguisherId}
											</TableCell>
											<TableCell className="font-medium tabular-nums">
												{f.count}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Card>
					)}
				</div>
			)}
		</DataState>
	);
}

const TABS: { value: ReportType; label: string }[] = [
	{ value: "inventory", label: "Inventory" },
	{ value: "inspections", label: "Inspections" },
	{ value: "compliance", label: "Compliance" },
	{ value: "maintenance", label: "Maintenance" },
];

export default function ReportsPage(): React.ReactElement {
	return (
		<div className="space-y-5">
			<PageHeader
				title="Reports"
				description="Real-time analytics across your fire-safety estate."
			/>

			<Tabs defaultValue="inventory">
				<TabsList className="max-w-full overflow-x-auto">
					{TABS.map((t) => (
						<TabsTab key={t.value} value={t.value}>
							{t.label}
						</TabsTab>
					))}
				</TabsList>

				<TabsPanel value="inventory" className="space-y-4 pt-2">
					<ExportButtons type="inventory" />
					<InventoryTab />
				</TabsPanel>
				<TabsPanel value="inspections" className="space-y-4 pt-2">
					<ExportButtons type="inspections" />
					<InspectionsTab />
				</TabsPanel>
				<TabsPanel value="compliance" className="space-y-4 pt-2">
					<ExportButtons type="compliance" />
					<ComplianceTab />
				</TabsPanel>
				<TabsPanel value="maintenance" className="space-y-4 pt-2">
					<ExportButtons type="maintenance" />
					<MaintenanceTab />
				</TabsPanel>
			</Tabs>
		</div>
	);
}
