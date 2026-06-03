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
import { useLogin } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { loginFormSchema } from "@/lib/validation";

export default function LoginPage(): React.ReactElement {
	const router = useRouter();
	const searchParams = useSearchParams();
	const login = useLogin();

	const [values, setValues] = useState({ email: "", password: "" });
	const [errors, setErrors] = useState<Record<string, string>>({});

	const redirectTo = searchParams.get("redirect") || "/dashboard";

	function update(field: keyof typeof values, value: string): void {
		setValues((v) => ({ ...v, [field]: value }));
		setErrors((e) => ({ ...e, [field]: "" }));
	}

	function handleSubmit(event: React.FormEvent): void {
		event.preventDefault();
		const parsed = loginFormSchema.safeParse(values);
		if (!parsed.success) {
			const next: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				next[String(issue.path[0])] = issue.message;
			}
			setErrors(next);
			return;
		}

		login.mutate(parsed.data, {
			onSuccess: ({ user }) => {
				toast.success(`Welcome back, ${user.firstName}`);
				router.replace(user.emailVerified ? redirectTo : "/auth/verify-email");
			},
			onError: (err) => {
				if (err instanceof ApiError && err.status === 401) {
					setErrors({ email: " ", password: "Invalid email or password" });
					return;
				}
				toast.fromError(err, "Couldn’t sign in");
			},
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Welcome back</CardTitle>
				<CardDescription>Sign in to your account to continue.</CardDescription>
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
						label="Password"
						htmlFor="password"
						error={errors.password}
					>
						<Input
							id="password"
							type="password"
							autoComplete="current-password"
							placeholder="••••••••"
							value={values.password}
							onChange={(e) => update("password", e.target.value)}
							aria-invalid={Boolean(errors.password)}
						/>
					</FormField>

					<div className="-mt-1 text-right">
						<Link
							href="/auth/forgot-password"
							className="text-muted-foreground text-sm hover:text-foreground hover:underline"
						>
							Forgot password?
						</Link>
					</div>

					<Button type="submit" className="w-full" loading={login.isPending}>
						Sign in
					</Button>
				</form>
			</CardPanel>
			<div className="border-t px-6 py-4 text-center text-muted-foreground text-sm">
				Don’t have an account?{" "}
				<Link
					href="/auth/register"
					className="font-medium text-foreground hover:underline"
				>
					Create one
				</Link>
			</div>
		</Card>
	);
}
