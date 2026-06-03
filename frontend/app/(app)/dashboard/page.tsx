"use client";

import {
	CircleCheckIcon,
	ClipboardCheckIcon,
	FireExtinguisherIcon,
	ShieldCheckIcon,
	TriangleAlertIcon,
	WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { BarChart } from "@/components/ui/bar-chart";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardPanel,
	CardTitle,
} from "@/components/ui/card";
import { ChartPlaceholder } from "@/components/ui/chart-common";
import { DonutChart } from "@/components/ui/donut-chart";
import { useExtinguishers } from "@/lib/api/extinguishers";
import {
	useComplianceReport,
	useInspectionReport,
	useInventoryReport,
	useMaintenanceReport,
} from "@/lib/api/reports";
import { formatDate, humanize } from "@/lib/format";

export default function DashboardPage(): React.ReactElement {
	const { user } = useAuth();
	const inventory = useInventoryReport();
	const compliance = useComplianceReport();
	const inspections = useInspectionReport();
	const maintenance = useMaintenanceReport();
	const extinguishers = useExtinguishers();

	const serialById = useMemo(() => {
		const map = new Map<string, string>();
		for (const e of extinguishers.data ?? []) map.set(e.id, e.serialNumber);
		return map;
	}, [extinguishers.data]);

	const loading = inventory.isLoading;
	const active = inventory.data?.byStatus.active ?? 0;
	const expired = compliance.data?.expiredCount ?? 0;

	const statusData = Object.entries(inventory.data?.byStatus ?? {}).map(
		([key, value]) => ({ name: humanize(key), value }),
	);
	const inspectionData = [
		{ name: "Pending", Inspections: inspections.data?.pending ?? 0 },
		{ name: "Completed", Inspections: inspections.data?.completed ?? 0 },
		{ name: "Overdue", Inspections: inspections.data?.overdue ?? 0 },
		{ name: "Cancelled", Inspections: inspections.data?.cancelled ?? 0 },
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title={`Welcome${user ? `, ${user.firstName}` : ""}`}
				description="Here’s the current state of your fire-safety estate."
			/>

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<StatCard
					label="Extinguishers"
					value={inventory.data?.total ?? 0}
					icon={<FireExtinguisherIcon />}
					loading={loading}
				/>
				<StatCard
					label="Active"
					value={active}
					tone="success"
					icon={<CircleCheckIcon />}
					loading={loading}
				/>
				<StatCard
					label="Expired"
					value={expired}
					tone={expired > 0 ? "destructive" : "default"}
					icon={<TriangleAlertIcon />}
					loading={compliance.isLoading}
				/>
				<StatCard
					label="Compliance"
					value={`${compliance.data?.complianceRate ?? 100}%`}
					tone="info"
					icon={<ShieldCheckIcon />}
					loading={compliance.isLoading}
				/>
				<StatCard
					label="Pending inspections"
					value={inspections.data?.pending ?? 0}
					icon={<ClipboardCheckIcon />}
					loading={inspections.isLoading}
				/>
				<StatCard
					label="Overdue inspections"
					value={inspections.data?.overdue ?? 0}
					tone={(inspections.data?.overdue ?? 0) > 0 ? "warning" : "default"}
					icon={<ClipboardCheckIcon />}
					loading={inspections.isLoading}
				/>
				<StatCard
					label="Maintenance (30d)"
					value={maintenance.data?.recentCount ?? 0}
					icon={<WrenchIcon />}
					loading={maintenance.isLoading}
				/>
				<StatCard
					label="Expiring soon"
					value={compliance.data?.upcomingCount ?? 0}
					tone={
						(compliance.data?.upcomingCount ?? 0) > 0 ? "warning" : "default"
					}
					icon={<TriangleAlertIcon />}
					loading={compliance.isLoading}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Inventory by status</CardTitle>
						<CardDescription>Lifecycle state across all units.</CardDescription>
					</CardHeader>
					<CardPanel>
						<div className="h-64">
							{inventory.data ? (
								<DonutChart data={statusData} category="value" index="name" />
							) : (
								<ChartPlaceholder loading={inventory.isLoading} />
							)}
						</div>
					</CardPanel>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Inspections</CardTitle>
						<CardDescription>Breakdown by current state.</CardDescription>
					</CardHeader>
					<CardPanel>
						<div className="h-64">
							{inspections.data ? (
								<BarChart
									data={inspectionData}
									index="name"
									categories={["Inspections"]}
									showLegend={false}
								/>
							) : (
								<ChartPlaceholder loading={inspections.isLoading} />
							)}
						</div>
					</CardPanel>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Needs attention</CardTitle>
						<CardDescription>
							Expired or soon-to-expire extinguishers.
						</CardDescription>
					</CardHeader>
					<CardPanel className="space-y-2">
						{[
							...(compliance.data?.expired ?? []),
							...(compliance.data?.upcoming ?? []),
						]
							.slice(0, 6)
							.map((item) => (
								<div
									key={item.id}
									className="flex items-center justify-between gap-3 rounded-lg border p-3"
								>
									<div className="min-w-0">
										<p className="truncate font-medium text-sm">
											{item.serialNumber}
										</p>
										<p className="truncate text-muted-foreground text-xs">
											{item.location}
										</p>
									</div>
									<Badge variant={item.daysRemaining < 0 ? "error" : "warning"}>
										{item.daysRemaining < 0
											? `Expired ${Math.abs(item.daysRemaining)}d ago`
											: `${item.daysRemaining}d left`}
									</Badge>
								</div>
							))}
						{!compliance.isLoading &&
							(compliance.data?.expired.length ?? 0) === 0 &&
							(compliance.data?.upcoming.length ?? 0) === 0 && (
								<p className="py-6 text-center text-muted-foreground text-sm">
									Everything is compliant. 🎉
								</p>
							)}
					</CardPanel>
					<div className="border-t px-6 py-3">
						<Button
							variant="ghost"
							size="sm"
							render={<Link href="/notifications" />}
						>
							View all alerts
						</Button>
					</div>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Overdue inspections</CardTitle>
						<CardDescription>
							Scheduled inspections now past due.
						</CardDescription>
					</CardHeader>
					<CardPanel className="space-y-2">
						{(inspections.data?.items.overdue ?? []).slice(0, 6).map((i) => (
							<div
								key={i.id}
								className="flex items-center justify-between gap-3 rounded-lg border p-3"
							>
								<div className="min-w-0">
									<p className="truncate font-medium text-sm">
										{serialById.get(i.extinguisherId) ?? "Extinguisher"}
									</p>
									<p className="truncate text-muted-foreground text-xs">
										Due {formatDate(i.scheduledDate)}
									</p>
								</div>
								<Badge variant="warning">Overdue</Badge>
							</div>
						))}
						{!inspections.isLoading &&
							(inspections.data?.items.overdue.length ?? 0) === 0 && (
								<p className="py-6 text-center text-muted-foreground text-sm">
									No overdue inspections.
								</p>
							)}
					</CardPanel>
					<div className="border-t px-6 py-3">
						<Button
							variant="ghost"
							size="sm"
							render={<Link href="/inspections" />}
						>
							Manage inspections
						</Button>
					</div>
				</Card>
			</div>
		</div>
	);
}
