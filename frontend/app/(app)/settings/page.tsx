"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardPanel,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	useChangePassword,
	useDeleteAccount,
	useLogoutAll,
	useUpdateProfile,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { changePasswordFormSchema, profileFormSchema } from "@/lib/validation";

function ProfileCard(): React.ReactElement {
	const { user } = useAuth();
	const update = useUpdateProfile();
	const [values, setValues] = useState({
		firstName: user?.firstName ?? "",
		lastName: user?.lastName ?? "",
		username: user?.username ?? "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	function set(key: keyof typeof values, value: string): void {
		setValues((v) => ({ ...v, [key]: value }));
		setErrors((e) => ({ ...e, [key]: "" }));
	}

	function handleSubmit(event: React.FormEvent): void {
		event.preventDefault();
		const parsed = profileFormSchema.safeParse(values);
		if (!parsed.success) {
			const next: Record<string, string> = {};
			for (const issue of parsed.error.issues)
				next[String(issue.path[0])] = issue.message;
			setErrors(next);
			return;
		}
		update.mutate(
			{
				firstName: parsed.data.firstName,
				lastName: parsed.data.lastName,
				username: parsed.data.username || undefined,
			},
			{
				onSuccess: () => toast.success("Profile updated"),
				onError: (err) => {
					if (err instanceof ApiError && err.status === 409) {
						setErrors({ username: "This username is already taken" });
						return;
					}
					toast.fromError(err);
				},
			},
		);
	}

	return (
		<Card render={<form onSubmit={handleSubmit} />}>
			<CardHeader>
				<CardTitle className="text-base">Profile</CardTitle>
				<CardDescription>Update your personal details.</CardDescription>
			</CardHeader>
			<CardPanel className="space-y-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						label="First name"
						htmlFor="firstName"
						error={errors.firstName}
						required
					>
						<Input
							id="firstName"
							value={values.firstName}
							onChange={(e) => set("firstName", e.target.value)}
							aria-invalid={Boolean(errors.firstName)}
						/>
					</FormField>
					<FormField
						label="Last name"
						htmlFor="lastName"
						error={errors.lastName}
						required
					>
						<Input
							id="lastName"
							value={values.lastName}
							onChange={(e) => set("lastName", e.target.value)}
							aria-invalid={Boolean(errors.lastName)}
						/>
					</FormField>
				</div>
				<FormField
					label="Username"
					htmlFor="username"
					error={errors.username}
					hint="Optional. Letters, numbers and underscores."
				>
					<Input
						id="username"
						value={values.username}
						onChange={(e) => set("username", e.target.value)}
						aria-invalid={Boolean(errors.username)}
					/>
				</FormField>
				<FormField label="Email" htmlFor="email" hint="Email can’t be changed.">
					<Input id="email" value={user?.email ?? ""} disabled />
				</FormField>
			</CardPanel>
			<CardFooter className="justify-end border-t">
				<Button type="submit" loading={update.isPending}>
					Save changes
				</Button>
			</CardFooter>
		</Card>
	);
}

function PasswordCard(): React.ReactElement {
	const change = useChangePassword();
	const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
	const [values, setValues] = useState(empty);
	const [errors, setErrors] = useState<Record<string, string>>({});

	function set(key: keyof typeof values, value: string): void {
		setValues((v) => ({ ...v, [key]: value }));
		setErrors((e) => ({ ...e, [key]: "" }));
	}

	function handleSubmit(event: React.FormEvent): void {
		event.preventDefault();
		const parsed = changePasswordFormSchema.safeParse(values);
		if (!parsed.success) {
			const next: Record<string, string> = {};
			for (const issue of parsed.error.issues)
				next[String(issue.path[0])] = issue.message;
			setErrors(next);
			return;
		}
		change.mutate(
			{
				currentPassword: parsed.data.currentPassword,
				newPassword: parsed.data.newPassword,
			},
			{
				onSuccess: () => {
					toast.success("Password changed", "Other sessions were signed out.");
					setValues(empty);
				},
				onError: (err) => {
					if (err instanceof ApiError && err.status === 401) {
						setErrors({ currentPassword: "Current password is incorrect" });
						return;
					}
					toast.fromError(err);
				},
			},
		);
	}

	return (
		<Card render={<form onSubmit={handleSubmit} />}>
			<CardHeader>
				<CardTitle className="text-base">Password</CardTitle>
				<CardDescription>
					Changing your password signs out your other devices.
				</CardDescription>
			</CardHeader>
			<CardPanel className="space-y-4">
				<FormField
					label="Current password"
					htmlFor="currentPassword"
					error={errors.currentPassword}
					required
				>
					<Input
						id="currentPassword"
						type="password"
						autoComplete="current-password"
						value={values.currentPassword}
						onChange={(e) => set("currentPassword", e.target.value)}
						aria-invalid={Boolean(errors.currentPassword)}
					/>
				</FormField>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						label="New password"
						htmlFor="newPassword"
						error={errors.newPassword}
						required
					>
						<Input
							id="newPassword"
							type="password"
							autoComplete="new-password"
							value={values.newPassword}
							onChange={(e) => set("newPassword", e.target.value)}
							aria-invalid={Boolean(errors.newPassword)}
						/>
					</FormField>
					<FormField
						label="Confirm new password"
						htmlFor="confirmPassword"
						error={errors.confirmPassword}
						required
					>
						<Input
							id="confirmPassword"
							type="password"
							autoComplete="new-password"
							value={values.confirmPassword}
							onChange={(e) => set("confirmPassword", e.target.value)}
							aria-invalid={Boolean(errors.confirmPassword)}
						/>
					</FormField>
				</div>
			</CardPanel>
			<CardFooter className="justify-end border-t">
				<Button type="submit" loading={change.isPending}>
					Change password
				</Button>
			</CardFooter>
		</Card>
	);
}

function DangerCard(): React.ReactElement {
	const router = useRouter();
	const logoutAll = useLogoutAll();
	const deleteAccount = useDeleteAccount();
	const [confirmOpen, setConfirmOpen] = useState(false);

	return (
		<Card className="border-destructive/30">
			<CardHeader>
				<CardTitle className="text-base">Account</CardTitle>
				<CardDescription>Session and account management.</CardDescription>
			</CardHeader>
			<CardPanel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="font-medium text-sm">Sign out everywhere</p>
					<p className="text-muted-foreground text-sm">
						Revoke every active session, including this one.
					</p>
				</div>
				<Button
					variant="outline"
					loading={logoutAll.isPending}
					onClick={() =>
						logoutAll.mutate(undefined, {
							onSuccess: () => {
								toast.success("Signed out of all devices");
								router.replace("/auth/login");
							},
							onError: (err) => toast.fromError(err),
						})
					}
				>
					Sign out all devices
				</Button>
			</CardPanel>
			<CardFooter className="flex-col items-stretch gap-3 border-destructive/30 border-t sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="font-medium text-destructive-foreground text-sm">
						Delete account
					</p>
					<p className="text-muted-foreground text-sm">
						Permanently delete your account. This cannot be undone.
					</p>
				</div>
				<Button variant="destructive" onClick={() => setConfirmOpen(true)}>
					Delete account
				</Button>
			</CardFooter>

			<ConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title="Delete your account?"
				description="This permanently deletes your account and signs you out. This action cannot be undone."
				confirmLabel="Delete my account"
				variant="destructive"
				loading={deleteAccount.isPending}
				onConfirm={() =>
					deleteAccount.mutate(undefined, {
						onSuccess: () => {
							toast.success("Account deleted");
							router.replace("/auth/register");
						},
						onError: (err) => toast.fromError(err),
					})
				}
			/>
		</Card>
	);
}

export default function SettingsPage(): React.ReactElement {
	return (
		<div className="mx-auto w-full max-w-2xl space-y-5">
			<PageHeader
				title="Settings"
				description="Manage your profile, password and account."
			/>
			<ProfileCard />
			<PasswordCard />
			<DangerCard />
		</div>
	);
}
