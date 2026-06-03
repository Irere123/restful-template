"use client";

import { DownloadIcon, FileTextIcon } from "lucide-react";

import { DataState } from "@/components/data-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
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

function CountTable({
	title,
	counts,
}: {
	title: string;
	counts: CountMap;
}): React.ReactElement {
	const entries = Object.entries(counts);
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{title}</CardTitle>
			</CardHeader>
			<CardPanel className="pt-0">
				{entries.length === 0 ? (
					<p className="py-4 text-muted-foreground text-sm">No data.</p>
				) : (
					<div className="divide-y">
						{entries.map(([key, value]) => (
							<div
								key={key}
								className="flex items-center justify-between py-2 text-sm"
							>
								<span className="text-muted-foreground">{humanize(key)}</span>
								<span className="font-medium tabular-nums">{value}</span>
							</div>
						))}
					</div>
				)}
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
						<CountTable title="By type" counts={q.data.byType} />
						<CountTable title="By size" counts={q.data.bySize} />
						<CountTable title="By status" counts={q.data.byStatus} />
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
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
					<StatCard label="Total" value={q.data.total} />
					<StatCard label="Pending" value={q.data.pending} tone="info" />
					<StatCard label="Completed" value={q.data.completed} tone="success" />
					<StatCard
						label="Overdue"
						value={q.data.overdue}
						tone={q.data.overdue > 0 ? "warning" : "default"}
					/>
					<StatCard label="Cancelled" value={q.data.cancelled} />
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

					{(q.data.expired.length > 0 || q.data.upcoming.length > 0) && (
						<Card className="overflow-hidden">
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
					{q.data.frequencyByExtinguisher.length > 0 && (
						<Card className="overflow-hidden">
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
