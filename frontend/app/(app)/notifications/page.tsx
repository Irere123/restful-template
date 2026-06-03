"use client";

import {
	BellIcon,
	CalendarClockIcon,
	CircleCheckIcon,
	ClipboardClockIcon,
	TriangleAlertIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { DataState } from "@/components/data-state";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { useExtinguishers } from "@/lib/api/extinguishers";
import { useComplianceReport, useInspectionReport } from "@/lib/api/reports";
import type { ComplianceItem, Inspection } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

function AlertRow({
	title,
	subtitle,
	badge,
}: {
	title: string;
	subtitle: string;
	badge: React.ReactNode;
}): React.ReactElement {
	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border p-3">
			<div className="min-w-0">
				<p className="truncate font-medium text-sm">{title}</p>
				<p className="truncate text-muted-foreground text-xs">{subtitle}</p>
			</div>
			{badge}
		</div>
	);
}

function AlertGroup({
	title,
	icon,
	count,
	empty,
	children,
}: {
	title: string;
	icon: React.ReactNode;
	count: number;
	empty: string;
	children: React.ReactNode;
}): React.ReactElement {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					{icon}
					{title}
					<Badge variant={count > 0 ? "warning" : "secondary"} className="ms-1">
						{count}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardPanel className="space-y-2 pt-0">
				{count === 0 ? (
					<p className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
						<CircleCheckIcon className="size-4 text-success" />
						{empty}
					</p>
				) : (
					children
				)}
			</CardPanel>
		</Card>
	);
}

export default function NotificationsPage(): React.ReactElement {
	const compliance = useComplianceReport();
	const inspections = useInspectionReport();
	const extinguishers = useExtinguishers();

	const serialById = useMemo(() => {
		const map = new Map<string, string>();
		for (const e of extinguishers.data ?? []) map.set(e.id, e.serialNumber);
		return map;
	}, [extinguishers.data]);

	const expired: ComplianceItem[] = compliance.data?.expired ?? [];
	const upcoming: ComplianceItem[] = compliance.data?.upcoming ?? [];
	const overdue: Inspection[] = inspections.data?.items.overdue ?? [];

	return (
		<div className="space-y-5">
			<PageHeader
				title="Alerts"
				description="Compliance and inspection alerts — the same signals sent in the daily digest emails."
			/>

			<Alert variant="info">
				<BellIcon />
				<AlertDescription>
					These alerts are generated live from your compliance and inspection
					data. Admins and inspectors also receive them by email on a schedule.
				</AlertDescription>
			</Alert>

			<DataState
				isLoading={compliance.isLoading || inspections.isLoading}
				isError={compliance.isError || inspections.isError}
				error={compliance.error ?? inspections.error}
				onRetry={() => {
					compliance.refetch();
					inspections.refetch();
				}}
			>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<AlertGroup
						title="Expired"
						icon={<TriangleAlertIcon className="size-4 text-destructive" />}
						count={expired.length}
						empty="No expired extinguishers."
					>
						{expired.map((item) => (
							<AlertRow
								key={item.id}
								title={item.serialNumber}
								subtitle={item.location}
								badge={
									<Badge variant="error">
										{Math.abs(item.daysRemaining)}d overdue
									</Badge>
								}
							/>
						))}
					</AlertGroup>

					<AlertGroup
						title="Expiring soon"
						icon={<CalendarClockIcon className="size-4 text-warning" />}
						count={upcoming.length}
						empty="Nothing expiring soon."
					>
						{upcoming.map((item) => (
							<AlertRow
								key={item.id}
								title={item.serialNumber}
								subtitle={`${item.location} · expires ${formatDate(item.expiryDate)}`}
								badge={
									<Badge variant="warning">{item.daysRemaining}d left</Badge>
								}
							/>
						))}
					</AlertGroup>

					<AlertGroup
						title="Overdue inspections"
						icon={<ClipboardClockIcon className="size-4 text-warning" />}
						count={overdue.length}
						empty="No overdue inspections."
					>
						{overdue.map((i) => (
							<AlertRow
								key={i.id}
								title={serialById.get(i.extinguisherId) ?? "Extinguisher"}
								subtitle={`Due ${formatDate(i.scheduledDate)}`}
								badge={<Badge variant="warning">Overdue</Badge>}
							/>
						))}
					</AlertGroup>

					<Card className="flex flex-col justify-center">
						<CardPanel className="flex flex-col items-start gap-3">
							<CardTitle className="text-base">Stay ahead</CardTitle>
							<p className="text-muted-foreground text-sm">
								Schedule inspections and log maintenance to keep these alerts
								clear.
							</p>
							<div className="flex flex-wrap gap-2">
								<Button size="sm" render={<Link href="/inspections" />}>
									Schedule inspection
								</Button>
								<Button
									size="sm"
									variant="outline"
									render={<Link href="/extinguishers" />}
								>
									View extinguishers
								</Button>
							</div>
						</CardPanel>
					</Card>
				</div>
			</DataState>
		</div>
	);
}
