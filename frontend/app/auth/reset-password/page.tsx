"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
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
			onError: (err) => toast.fromError(err, "Couldn't reset password"),
		});
	}

	return (
		<div>
			<div>
				<h1 className="font-semibold text-[30px] leading-9 tracking-normal text-slate-950">
					Reset password
				</h1>
				<p className="mt-3 text-base text-slate-600">
					Enter the code we emailed you and choose a new password.
				</p>
			</div>

			<form className="mt-9 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
				<FormField label="Email" htmlFor="email" error={errors.email}>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						placeholder="Enter your email"
						size="lg"
						value={values.email}
						onChange={(e) => update("email", e.target.value)}
						aria-invalid={Boolean(errors.email)}
						className="rounded-lg border-slate-300 bg-white text-slate-950 shadow-sm"
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
						size="lg"
						value={values.code}
						onChange={(e) =>
							update("code", e.target.value.replace(/\D/g, "").slice(0, 6))
						}
						aria-invalid={Boolean(errors.code)}
						className="rounded-lg border-slate-300 bg-white text-slate-950 shadow-sm"
					/>
				</FormField>

				<FormField
					label="New password"
					htmlFor="newPassword"
					error={errors.newPassword}
					hint="Must be at least 8 characters."
				>
					<Input
						id="newPassword"
						type="password"
						autoComplete="new-password"
						placeholder="Create a password"
						size="lg"
						value={values.newPassword}
						onChange={(e) => update("newPassword", e.target.value)}
						aria-invalid={Boolean(errors.newPassword)}
						className="rounded-lg border-slate-300 bg-white text-slate-950 shadow-sm"
					/>
				</FormField>

				<Button
					type="submit"
					size="xl"
					className="mt-1 h-11 w-full border-violet-600 bg-violet-600 text-white shadow-none hover:bg-violet-700"
					loading={reset.isPending}
				>
					Reset password
				</Button>
			</form>

			<div className="mt-8 text-center">
				<Link
					href="/auth/login"
					className="font-semibold text-sm text-violet-600 hover:text-violet-700"
				>
					Back to sign in
				</Link>
			</div>
		</div>
	);
}
