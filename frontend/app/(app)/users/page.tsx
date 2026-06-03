"use client";

import {
	CircleCheckIcon,
	EllipsisIcon,
	PlusIcon,
	ShieldIcon,
	Trash2Icon,
	UsersIcon,
} from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataState } from "@/components/data-state";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { RoleBadge } from "@/components/status-badge";
import { TablePagination } from "@/components/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
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
import { usePagination } from "@/hooks/use-pagination";
import { ApiError } from "@/lib/api/client";
import { USER_ROLES, type User, type UserRole } from "@/lib/api/types";
import {
	useCreateUser,
	useDeleteUser,
	useUpdateUserRole,
	useUsers,
} from "@/lib/api/users";
import { formatDate, labelForRole } from "@/lib/format";
import { toast } from "@/lib/toast";
import { createManagedUserFormSchema } from "@/lib/validation";

export default function UsersPage(): React.ReactElement {
	const { isAdmin, user: currentUser } = useAuth();
	const query = useUsers();
	const updateRole = useUpdateUserRole();
	const remove = useDeleteUser();
	const [deleteTarget, setDeleteTarget] = useState<User | undefined>();
	const [createOpen, setCreateOpen] = useState(false);

	const rows = query.data ?? [];
	const pagination = usePagination(rows);

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
				actions={
					<Button onClick={() => setCreateOpen(true)}>
						<PlusIcon />
						Register inspector
					</Button>
				}
			/>

			<Card className="overflow-hidden rounded-lg">
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
							{pagination.pageItems.map((u) => {
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
													<MenuRadioGroup
														value={u.role}
														onValueChange={(value) =>
															changeRole(u, value as UserRole)
														}
													>
														<MenuGroupLabel>Change role</MenuGroupLabel>
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
					<TablePagination
						page={pagination.page}
						pageCount={pagination.pageCount}
						total={pagination.total}
						from={pagination.from}
						to={pagination.to}
						onPageChange={pagination.setPage}
						itemLabel="users"
					/>
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
			<CreateInspectorDialog open={createOpen} onOpenChange={setCreateOpen} />
		</div>
	);
}

function CreateInspectorDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}): React.ReactElement {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogPopup className="max-w-lg">
				{open && <CreateInspectorForm onDone={() => onOpenChange(false)} />}
			</DialogPopup>
		</Dialog>
	);
}

function CreateInspectorForm({
	onDone,
}: {
	onDone: () => void;
}): React.ReactElement {
	const create = useCreateUser();
	const [values, setValues] = useState({
		firstName: "",
		lastName: "",
		email: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	function set<K extends keyof typeof values>(
		key: K,
		value: (typeof values)[K],
	): void {
		setValues((v) => ({ ...v, [key]: value }));
		setErrors((e) => ({ ...e, [key]: "" }));
	}

	function handleSubmit(event: React.FormEvent): void {
		event.preventDefault();
		const parsed = createManagedUserFormSchema.safeParse({
			...values,
			role: "inspector",
		});
		if (!parsed.success) {
			const next: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				next[String(issue.path[0])] = issue.message;
			}
			setErrors(next);
			return;
		}

		create.mutate(parsed.data, {
			onSuccess: ({ user, resetEmailSent }) => {
				if (resetEmailSent) {
					toast.success(
						"Inspector registered",
						`${user.displayName} has been emailed a password setup code.`,
					);
				} else {
					toast.warning(
						"Inspector registered",
						"Send them to Forgot password so they can request a setup code.",
					);
				}
				onDone();
			},
			onError: (err) => {
				if (err instanceof ApiError) {
					if (err.status === 409) {
						setErrors({ email: "An account with this email already exists" });
						return;
					}
					if (Object.keys(err.fieldErrors).length) {
						setErrors(err.fieldErrors);
						return;
					}
				}
				toast.fromError(err, "Couldn't register inspector");
			},
		});
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="contents">
			<DialogHeader>
				<DialogTitle>Register inspector</DialogTitle>
				<DialogDescription>
					Create an inspector account and email them a code to set their
					password before signing in.
				</DialogDescription>
			</DialogHeader>
			<DialogPanel className="space-y-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						label="First name"
						htmlFor="inspectorFirstName"
						error={errors.firstName}
						required
					>
						<Input
							id="inspectorFirstName"
							autoComplete="given-name"
							placeholder="Pippa"
							value={values.firstName}
							onChange={(e) => set("firstName", e.target.value)}
							aria-invalid={Boolean(errors.firstName)}
						/>
					</FormField>
					<FormField
						label="Last name"
						htmlFor="inspectorLastName"
						error={errors.lastName}
						required
					>
						<Input
							id="inspectorLastName"
							autoComplete="family-name"
							placeholder="Wilkinson"
							value={values.lastName}
							onChange={(e) => set("lastName", e.target.value)}
							aria-invalid={Boolean(errors.lastName)}
						/>
					</FormField>
				</div>
				<FormField
					label="Email"
					htmlFor="inspectorEmail"
					error={errors.email}
					required
					hint="They will receive a password setup code at this address."
				>
					<Input
						id="inspectorEmail"
						type="email"
						autoComplete="email"
						placeholder="inspector@company.com"
						value={values.email}
						onChange={(e) => set("email", e.target.value)}
						aria-invalid={Boolean(errors.email)}
					/>
				</FormField>
			</DialogPanel>
			<DialogFooter>
				<DialogClose
					disabled={create.isPending}
					render={<Button variant="outline" />}
				>
					Cancel
				</DialogClose>
				<Button type="submit" loading={create.isPending}>
					Register inspector
				</Button>
			</DialogFooter>
		</form>
	);
}
