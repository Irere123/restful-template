"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardPanel,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useResetPassword } from "@/lib/api/auth";
import { toast } from "@/lib/toast";
import { resetPasswordFormSchema } from "@/lib/validation";

export default function ResetPasswordPage(): React.ReactElement {
	const router = useRouter();
	const params = useSearchParams();
	const reset = useResetPassword();

	const [values, setValues] = useState({
		email: params.get("email") ?? "",
		code: "",
		newPassword: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	function update(field: keyof typeof values, value: string): void {
		setValues((v) => ({ ...v, [field]: value }));
		setErrors((e) => ({ ...e, [field]: "" }));
	}

	function handleSubmit(event: React.FormEvent): void {
		event.preventDefault();
		const parsed = resetPasswordFormSchema.safeParse(values);
		if (!parsed.success) {
			const next: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				next[String(issue.path[0])] = issue.message;
			}
			setErrors(next);
			return;
		}

		reset.mutate(parsed.data, {
			onSuccess: () => {
				toast.success(
					"Password reset",
					"You can now sign in with your new password.",
				);
				router.replace("/auth/login");
			},
			onError: (err) => toast.fromError(err, "Couldn’t reset password"),
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Reset password</CardTitle>
				<CardDescription>
					Enter the code we emailed you and choose a new password.
				</CardDescription>
			</CardHeader>
			<CardPanel>
				<form
					className="flex flex-col gap-4"
					onSubmit={handleSubmit}
					noValidate
				>
					<FormField label="Email" htmlFor="email" error={errors.email}>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							placeholder="you@company.com"
							value={values.email}
							onChange={(e) => update("email", e.target.value)}
							aria-invalid={Boolean(errors.email)}
						/>
					</FormField>

					<FormField
						label="Reset code"
						htmlFor="code"
						error={errors.code}
						hint="The 6-digit code from your email."
					>
						<Input
							id="code"
							inputMode="numeric"
							autoComplete="one-time-code"
							placeholder="123456"
							maxLength={6}
							value={values.code}
							onChange={(e) =>
								update("code", e.target.value.replace(/\D/g, "").slice(0, 6))
							}
							aria-invalid={Boolean(errors.code)}
						/>
					</FormField>

					<FormField
						label="New password"
						htmlFor="newPassword"
						error={errors.newPassword}
						hint="At least 8 characters."
					>
						<Input
							id="newPassword"
							type="password"
							autoComplete="new-password"
							placeholder="••••••••"
							value={values.newPassword}
							onChange={(e) => update("newPassword", e.target.value)}
							aria-invalid={Boolean(errors.newPassword)}
						/>
					</FormField>

					<Button type="submit" className="w-full" loading={reset.isPending}>
						Reset password
					</Button>
				</form>
			</CardPanel>
			<div className="border-t px-6 py-4 text-center text-muted-foreground text-sm">
				<Link
					href="/auth/login"
					className="font-medium text-foreground hover:underline"
				>
					Back to sign in
				</Link>
			</div>
		</Card>
	);
}
