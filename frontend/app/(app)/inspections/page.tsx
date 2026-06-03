"use client";

import {
	BanIcon,
	CalendarClockIcon,
	CheckIcon,
	ClipboardCheckIcon,
	EllipsisIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
	CompleteInspectionDialog,
	RescheduleInspectionDialog,
	ScheduleInspectionDialog,
} from "./inspection-dialogs";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataState } from "@/components/data-state";
import { FilterSelect } from "@/components/enum-select";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import {
	InspectionResultBadge,
	InspectionStatusBadge,
} from "@/components/status-badge";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Menu,
	MenuItem,
	MenuPopup,
	MenuSeparator,
	MenuTrigger,
} from "@/components/ui/menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import { useExtinguishers } from "@/lib/api/extinguishers";
import {
	useDeleteInspection,
	useInspections,
	useUpdateInspection,
} from "@/lib/api/inspections";
import type { Inspection, InspectionStatus } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { inspectionStatusOptions } from "@/lib/options";
import { toast } from "@/lib/toast";

export default function InspectionsPage(): React.ReactElement {
	const [status, setStatus] = useState<InspectionStatus | undefined>();

	const query = useInspections({ status });
	const extinguishers = useExtinguishers();
	const remove = useDeleteInspection();
	const update = useUpdateInspection();

	const [scheduleOpen, setScheduleOpen] = useState(false);
	const [completing, setCompleting] = useState<Inspection | undefined>();
	const [rescheduling, setRescheduling] = useState<Inspection | undefined>();
	const [cancelling, setCancelling] = useState<Inspection | undefined>();
	const [deleteTarget, setDeleteTarget] = useState<Inspection | undefined>();

	const serialById = useMemo(() => {
		const map = new Map<string, string>();
		for (const e of extinguishers.data ?? []) map.set(e.id, e.serialNumber);
		return map;
	}, [extinguishers.data]);

	const rows = query.data ?? [];
	const pagination = usePagination(rows, { resetKey: status });

	function confirmCancel(): void {
		if (!cancelling) return;
		update.mutate(
			{ id: cancelling.id, input: { status: "cancelled" } },
			{
				onSuccess: () => {
					toast.success("Inspection cancelled");
					setCancelling(undefined);
				},
				onError: (err) => toast.fromError(err),
			},
		);
	}

	function confirmDelete(): void {
		if (!deleteTarget) return;
		remove.mutate(deleteTarget.id, {
			onSuccess: () => {
				toast.success("Inspection deleted");
				setDeleteTarget(undefined);
			},
			onError: (err) => toast.fromError(err),
		});
	}

	return (
		<div className="space-y-5">
			<PageHeader
				title="Inspections"
				description="Schedule and record extinguisher inspections."
				actions={
					<div className="flex w-full items-center justify-end gap-2 sm:w-auto">
						<FilterSelect
							value={status}
							onChange={setStatus}
							options={inspectionStatusOptions}
							allLabel="All statuses"
							ariaLabel="Filter by status"
							size="default"
							className="w-44"
						/>
						<Button onClick={() => setScheduleOpen(true)} className="shrink-0">
							<PlusIcon />
							Schedule inspection
						</Button>
					</div>
				}
			/>

			<Card className="overflow-hidden rounded-lg">
				<DataState
					isLoading={query.isLoading}
					isError={query.isError}
					error={query.error}
					onRetry={() => query.refetch()}
					isEmpty={(query.data?.length ?? 0) === 0}
					emptyTitle={status ? "No matching inspections" : "No inspections yet"}
					emptyDescription={
						status
							? "Try a different status filter."
							: "Schedule your first inspection to get started."
					}
					emptyMedia={<ClipboardCheckIcon />}
					emptyAction={
						!status ? (
							<Button size="sm" onClick={() => setScheduleOpen(true)}>
								<PlusIcon />
								Schedule inspection
							</Button>
						) : undefined
					}
				>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Extinguisher</TableHead>
								<TableHead>Scheduled</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Result</TableHead>
								<TableHead className="w-px" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{pagination.pageItems.map((i) => {
								const isScheduled = i.status === "scheduled";
								return (
									<TableRow key={i.id}>
										<TableCell className="font-medium">
											{serialById.get(i.extinguisherId) ?? "—"}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatDate(i.scheduledDate)}
											{i.scheduledTime ? ` · ${i.scheduledTime}` : ""}
										</TableCell>
										<TableCell>
											<InspectionStatusBadge status={i.status} />
										</TableCell>
										<TableCell>
											<InspectionResultBadge result={i.result} />
										</TableCell>
										<TableCell>
											<RoleGate roles={["admin", "inspector"]}>
												<Menu>
													<MenuTrigger
														render={<Button variant="ghost" size="icon-sm" />}
														aria-label="Row actions"
													>
														<EllipsisIcon />
													</MenuTrigger>
													<MenuPopup align="end">
														<MenuItem
															disabled={!isScheduled}
															onClick={() => setCompleting(i)}
														>
															<CheckIcon />
															Record result
														</MenuItem>
														<MenuItem
															disabled={!isScheduled}
															onClick={() => setRescheduling(i)}
														>
															<CalendarClockIcon />
															Reschedule
														</MenuItem>
														<MenuItem
															disabled={!isScheduled}
															onClick={() => setCancelling(i)}
														>
															<BanIcon />
															Cancel
														</MenuItem>
														<RoleGate roles={["admin"]}>
															<MenuSeparator />
															<MenuItem
																variant="destructive"
																onClick={() => setDeleteTarget(i)}
															>
																<Trash2Icon />
																Delete
															</MenuItem>
														</RoleGate>
													</MenuPopup>
												</Menu>
											</RoleGate>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
					<TablePagination
						page={pagination.page}
						pageCount={pagination.pageCount}
						total={pagination.total}
						from={pagination.from}
						to={pagination.to}
						onPageChange={pagination.setPage}
						itemLabel="inspections"
					/>
				</DataState>
			</Card>

			<ScheduleInspectionDialog
				open={scheduleOpen}
				onOpenChange={setScheduleOpen}
			/>
			<CompleteInspectionDialog
				inspection={completing}
				onOpenChange={(open) => !open && setCompleting(undefined)}
			/>
			<RescheduleInspectionDialog
				inspection={rescheduling}
				onOpenChange={(open) => !open && setRescheduling(undefined)}
			/>

			<ConfirmDialog
				open={Boolean(cancelling)}
				onOpenChange={(open) => !open && setCancelling(undefined)}
				title="Cancel inspection?"
				description="This inspection will be marked as cancelled."
				confirmLabel="Cancel inspection"
				variant="destructive"
				loading={update.isPending}
				onConfirm={confirmCancel}
			/>
			<ConfirmDialog
				open={Boolean(deleteTarget)}
				onOpenChange={(open) => !open && setDeleteTarget(undefined)}
				title="Delete inspection?"
				description="This inspection record will be permanently removed."
				confirmLabel="Delete"
				variant="destructive"
				loading={remove.isPending}
				onConfirm={confirmDelete}
			/>
		</div>
	);
}
