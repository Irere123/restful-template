"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
	const [remember, setRemember] = useState(false);

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
				toast.fromError(err, "Couldn't sign in");
			},
		});
	}

	return (
		<div>
			<div>
				<h1 className="font-semibold text-[30px] leading-9 tracking-normal text-foreground">
					Welcome back
				</h1>
				<p className="mt-3 text-base text-muted-foreground">
					Welcome back! Please enter your details.
				</p>
			</div>

			<form className="mt-9 flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
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
						className="rounded-lg shadow-sm"
					/>
				</FormField>

				<FormField label="Password" htmlFor="password" error={errors.password}>
					<Input
						id="password"
						type="password"
						autoComplete="current-password"
						placeholder="Password"
						size="lg"
						value={values.password}
						onChange={(e) => update("password", e.target.value)}
						aria-invalid={Boolean(errors.password)}
						className="rounded-lg shadow-sm"
					/>
				</FormField>

				<div className="-mt-1 flex items-center justify-between gap-4 text-sm">
					<Label
						htmlFor="remember"
						className="cursor-pointer font-medium text-foreground"
					>
						<Checkbox
							id="remember"
							checked={remember}
							onCheckedChange={(checked) => setRemember(checked === true)}
							className="border-input"
						/>
						Remember for 30 days
					</Label>
					<Link
						href="/auth/forgot-password"
						className="font-semibold text-violet-600 hover:text-violet-700"
					>
						Forgot password
					</Link>
				</div>

				<Button
					type="submit"
					size="xl"
					className="h-11 w-full border-violet-600 bg-violet-600 text-white shadow-none hover:bg-violet-700"
					loading={login.isPending}
				>
					Sign in
				</Button>
			</form>

			<div className="mt-8 text-center text-muted-foreground text-sm">
				Don&apos;t have an account?{" "}
				<Link
					href="/auth/register"
					className="font-semibold text-violet-600 hover:text-violet-700"
				>
					Sign up
				</Link>
			</div>
		</div>
	);
}
