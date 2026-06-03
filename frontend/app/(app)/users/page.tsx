"use client";

import {
	CircleCheckIcon,
	EllipsisIcon,
	ShieldIcon,
	Trash2Icon,
	UsersIcon,
} from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataState } from "@/components/data-state";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { RoleBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Menu,
	MenuGroupLabel,
	MenuItem,
	MenuPopup,
	MenuRadioGroup,
	MenuRadioItem,
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
import { USER_ROLES, type User, type UserRole } from "@/lib/api/types";
import { useDeleteUser, useUpdateUserRole, useUsers } from "@/lib/api/users";
import { formatDate, labelForRole } from "@/lib/format";
import { toast } from "@/lib/toast";

export default function UsersPage(): React.ReactElement {
	const { isAdmin, user: currentUser } = useAuth();
	const query = useUsers();
	const updateRole = useUpdateUserRole();
	const remove = useDeleteUser();
	const [deleteTarget, setDeleteTarget] = useState<User | undefined>();

	if (!isAdmin) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ShieldIcon />
					</EmptyMedia>
					<EmptyTitle>Admins only</EmptyTitle>
					<EmptyDescription>
						You don’t have permission to manage users.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	function changeRole(target: User, role: UserRole): void {
		if (role === target.role) return;
		updateRole.mutate(
			{ id: target.id, role },
			{
				onSuccess: () =>
					toast.success(
						"Role updated",
						`${target.displayName} is now ${labelForRole(role)}.`,
					),
				onError: (err) => toast.fromError(err),
			},
		);
	}

	function confirmDelete(): void {
		if (!deleteTarget) return;
		remove.mutate(deleteTarget.id, {
			onSuccess: () => {
				toast.success("User deleted");
				setDeleteTarget(undefined);
			},
			onError: (err) => toast.fromError(err),
		});
	}

	return (
		<div className="space-y-5">
			<PageHeader
				title="Users"
				description="Manage accounts and roles across the organization."
			/>

			<Card className="overflow-hidden">
				<DataState
					isLoading={query.isLoading}
					isError={query.isError}
					error={query.error}
					onRetry={() => query.refetch()}
					isEmpty={(query.data?.length ?? 0) === 0}
					emptyTitle="No users"
					emptyMedia={<UsersIcon />}
				>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Verified</TableHead>
								<TableHead>Joined</TableHead>
								<TableHead className="w-px" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{(query.data ?? []).map((u) => {
								const isSelf = u.id === currentUser?.id;
								return (
									<TableRow key={u.id}>
										<TableCell className="font-medium">
											{u.displayName}
											{isSelf && (
												<span className="ms-2 text-muted-foreground text-xs">
													(you)
												</span>
											)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{u.email}
										</TableCell>
										<TableCell>
											<RoleBadge role={u.role} />
										</TableCell>
										<TableCell>
											{u.emailVerified ? (
												<Badge variant="success">
													<CircleCheckIcon />
													Verified
												</Badge>
											) : (
												<Badge variant="secondary">Unverified</Badge>
											)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatDate(u.createdAt)}
										</TableCell>
										<TableCell>
											<Menu>
												<MenuTrigger
													render={<Button variant="ghost" size="icon-sm" />}
													aria-label="Row actions"
												>
													<EllipsisIcon />
												</MenuTrigger>
												<MenuPopup align="end">
													<MenuGroupLabel>Change role</MenuGroupLabel>
													<MenuRadioGroup
														value={u.role}
														onValueChange={(value) =>
															changeRole(u, value as UserRole)
														}
													>
														{USER_ROLES.map((role) => (
															<MenuRadioItem key={role} value={role}>
																{labelForRole(role)}
															</MenuRadioItem>
														))}
													</MenuRadioGroup>
													<MenuSeparator />
													<MenuItem
														variant="destructive"
														disabled={isSelf}
														onClick={() => setDeleteTarget(u)}
													>
														<Trash2Icon />
														Delete user
													</MenuItem>
												</MenuPopup>
											</Menu>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</DataState>
			</Card>

			<ConfirmDialog
				open={Boolean(deleteTarget)}
				onOpenChange={(open) => !open && setDeleteTarget(undefined)}
				title="Delete user?"
				description={
					deleteTarget
						? `${deleteTarget.displayName}’s account will be permanently deleted.`
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
