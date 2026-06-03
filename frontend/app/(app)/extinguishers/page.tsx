"use client";

import {
	EllipsisIcon,
	FireExtinguisherIcon,
	PencilIcon,
	PlusIcon,
	SearchIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ExtinguisherFormDialog } from "./extinguisher-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataState } from "@/components/data-state";
import { FilterSelect } from "@/components/enum-select";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { RoleGate } from "@/components/role-gate";
import { ExtinguisherStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
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
import {
	useDeleteExtinguisher,
	useExtinguishers,
} from "@/lib/api/extinguishers";
import type {
	Extinguisher,
	ExtinguisherStatus,
	ExtinguisherType,
} from "@/lib/api/types";
import { formatDate, labelForType } from "@/lib/format";
import { statusOptions, typeOptions } from "@/lib/options";
import { toast } from "@/lib/toast";

export default function ExtinguishersPage(): React.ReactElement {
	const { canManage } = useAuth();
	const [status, setStatus] = useState<ExtinguisherStatus | undefined>();
	const [type, setType] = useState<ExtinguisherType | undefined>();
	const [search, setSearch] = useState("");

	const query = useExtinguishers({ status, type });
	const remove = useDeleteExtinguisher();

	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Extinguisher | undefined>();
	const [deleteTarget, setDeleteTarget] = useState<Extinguisher | undefined>();

	const rows = useMemo(() => {
		const term = search.trim().toLowerCase();
		const data = query.data ?? [];
		if (!term) return data;
		return data.filter(
			(e) =>
				e.serialNumber.toLowerCase().includes(term) ||
				e.location.toLowerCase().includes(term),
		);
	}, [query.data, search]);

	function openCreate(): void {
		setEditing(undefined);
		setFormOpen(true);
	}

	function openEdit(extinguisher: Extinguisher): void {
		setEditing(extinguisher);
		setFormOpen(true);
	}

	function confirmDelete(): void {
		if (!deleteTarget) return;
		remove.mutate(deleteTarget.id, {
			onSuccess: () => {
				toast.success("Extinguisher deleted");
				setDeleteTarget(undefined);
			},
			onError: (err) => toast.fromError(err),
		});
	}

	return (
		<div className="space-y-5">
			<PageHeader
				title="Extinguishers"
				description="Your fire extinguisher registry."
				actions={
					<RoleGate roles={["admin", "inspector"]}>
						<Button onClick={openCreate}>
							<PlusIcon />
							Add extinguisher
						</Button>
					</RoleGate>
				}
			/>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="min-w-0 flex-1 sm:max-w-md">
					<InputGroup className="h-10 rounded-lg bg-background shadow-none sm:h-9">
						<InputGroupAddon>
							<SearchIcon className="text-muted-foreground" />
						</InputGroupAddon>
						<InputGroupInput
							type="search"
							placeholder="Search serial or location"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							aria-label="Search by serial number or location"
						/>
						{search && (
							<InputGroupAddon align="inline-end">
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									aria-label="Clear search"
									onClick={() => setSearch("")}
								>
									<XIcon />
								</Button>
							</InputGroupAddon>
						)}
					</InputGroup>
				</div>
				<div className="flex flex-wrap items-center justify-end gap-2 sm:ms-auto">
					<FilterSelect
						value={status}
						onChange={setStatus}
						options={statusOptions}
						allLabel="All statuses"
						ariaLabel="Filter by status"
						size="default"
						className="w-40"
					/>
					<FilterSelect
						value={type}
						onChange={setType}
						options={typeOptions}
						allLabel="All types"
						ariaLabel="Filter by type"
						size="default"
						className="w-36"
					/>
				</div>
			</div>

			<Card className="overflow-hidden rounded-lg">
				<DataState
					isLoading={query.isLoading}
					isError={query.isError}
					error={query.error}
					onRetry={() => query.refetch()}
					isEmpty={rows.length === 0}
					emptyTitle={
						search || status || type ? "No matches" : "No extinguishers yet"
					}
					emptyDescription={
						search || status || type
							? "Try adjusting your filters."
							: "Register your first extinguisher to get started."
					}
					emptyMedia={<FireExtinguisherIcon />}
					emptyAction={
						canManage && !search && !status && !type ? (
							<Button onClick={openCreate} size="sm">
								<PlusIcon />
								Add extinguisher
							</Button>
						) : undefined
					}
				>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Serial</TableHead>
								<TableHead>Location</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Size</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Expiry</TableHead>
								<TableHead className="w-px" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((e) => (
								<TableRow key={e.id}>
									<TableCell className="font-medium">
										{e.serialNumber}
									</TableCell>
									<TableCell className="max-w-50 truncate text-muted-foreground">
										{e.location}
									</TableCell>
									<TableCell>{labelForType(e.type)}</TableCell>
									<TableCell>
										<Badge variant="outline">{e.size}</Badge>
									</TableCell>
									<TableCell>
										<ExtinguisherStatusBadge status={e.status} />
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatDate(e.expiryDate)}
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
													<MenuItem onClick={() => openEdit(e)}>
														<PencilIcon />
														Edit
													</MenuItem>
													<RoleGate roles={["admin"]}>
														<MenuSeparator />
														<MenuItem
															variant="destructive"
															onClick={() => setDeleteTarget(e)}
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
							))}
						</TableBody>
					</Table>
				</DataState>
			</Card>

			<ExtinguisherFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				extinguisher={editing}
			/>

			<ConfirmDialog
				open={Boolean(deleteTarget)}
				onOpenChange={(open) => !open && setDeleteTarget(undefined)}
				title="Delete extinguisher?"
				description={
					deleteTarget
						? `“${deleteTarget.serialNumber}” and its inspections and maintenance history will be permanently removed.`
						: undefined
				}
				confirmLabel="Delete"
				variant="destructive"
				loading={remove.isPending}
				onConfirm={confirmDelete}
			/>
		</div>
	);
}
