"use client";

import { PlusIcon, WrenchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { MaintenanceFormDialog } from "./maintenance-form-dialog";
import { DataState } from "@/components/data-state";
import { FilterSelect } from "@/components/enum-select";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useExtinguishers } from "@/lib/api/extinguishers";
import { useMaintenanceLogs } from "@/lib/api/maintenance";
import { formatDate } from "@/lib/format";

export default function MaintenancePage(): React.ReactElement {
	const [extinguisherId, setExtinguisherId] = useState<string | undefined>();
	const [formOpen, setFormOpen] = useState(false);

	const extinguishers = useExtinguishers();
	const query = useMaintenanceLogs(extinguisherId);

	const serialById = useMemo(() => {
		const map = new Map<string, string>();
		for (const e of extinguishers.data ?? []) map.set(e.id, e.serialNumber);
		return map;
	}, [extinguishers.data]);

	const extinguisherOptions = useMemo(
		() =>
			(extinguishers.data ?? []).map((e) => ({
				value: e.id,
				label: `${e.serialNumber} — ${e.location}`,
			})),
		[extinguishers.data],
	);

	return (
		<div className="space-y-5">
			<PageHeader
				title="Maintenance"
				description="A log of all maintenance carried out on your extinguishers."
				actions={
					<RoleGate roles={["admin", "inspector"]}>
						<Button onClick={() => setFormOpen(true)}>
							<PlusIcon />
							Log maintenance
						</Button>
					</RoleGate>
				}
			/>

			<div className="flex items-center gap-2">
				<FilterSelect
					value={extinguisherId}
					onChange={setExtinguisherId}
					options={extinguisherOptions}
					allLabel="All extinguishers"
					ariaLabel="Filter by extinguisher"
					className="min-w-56"
				/>
			</div>

			<Card className="overflow-hidden">
				<DataState
					isLoading={query.isLoading}
					isError={query.isError}
					error={query.error}
					onRetry={() => query.refetch()}
					isEmpty={(query.data?.length ?? 0) === 0}
					emptyTitle="No maintenance logged"
					emptyDescription="Maintenance activity will appear here once recorded."
					emptyMedia={<WrenchIcon />}
				>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Extinguisher</TableHead>
								<TableHead>Action taken</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Issues identified</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{(query.data ?? []).map((m) => (
								<TableRow key={m.id}>
									<TableCell className="font-medium">
										{serialById.get(m.extinguisherId) ?? "—"}
									</TableCell>
									<TableCell>{m.actionTaken}</TableCell>
									<TableCell className="text-muted-foreground">
										{formatDate(m.maintenanceDate)}
									</TableCell>
									<TableCell className="max-w-72 truncate text-muted-foreground">
										{m.issuesIdentified || "—"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</DataState>
			</Card>

			<MaintenanceFormDialog open={formOpen} onOpenChange={setFormOpen} />
		</div>
	);
}
