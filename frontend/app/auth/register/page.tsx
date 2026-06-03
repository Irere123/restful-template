"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useRegister } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { registerFormSchema } from "@/lib/validation";

const EMPTY = { firstName: "", lastName: "", email: "", password: "" };

export default function RegisterPage(): React.ReactElement {
	const router = useRouter();
	const register = useRegister();

	const [values, setValues] = useState(EMPTY);
	const [errors, setErrors] = useState<Record<string, string>>({});

	function update(field: keyof typeof EMPTY, value: string): void {
		setValues((v) => ({ ...v, [field]: value }));
		setErrors((e) => ({ ...e, [field]: "" }));
	}

	function handleSubmit(event: React.FormEvent): void {
		event.preventDefault();
		const parsed = registerFormSchema.safeParse(values);
		if (!parsed.success) {
			const next: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				next[String(issue.path[0])] = issue.message;
			}
			setErrors(next);
			return;
		}

		register.mutate(parsed.data, {
			onSuccess: () => {
				toast.success(
					"Account created",
					"We’ve emailed you a 6-digit verification code.",
				);
				router.replace("/auth/verify-email");
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
				toast.fromError(err, "Couldn’t create your account");
			},
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Create your account</CardTitle>
				<CardDescription>
					Get started managing fire-safety compliance.
				</CardDescription>
			</CardHeader>
			<CardPanel>
				<form
					className="flex flex-col gap-4"
					onSubmit={handleSubmit}
					noValidate
				>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<FormField
							label="First name"
							htmlFor="firstName"
							error={errors.firstName}
							required
						>
							<Input
								id="firstName"
								autoComplete="given-name"
								placeholder="Ada"
								value={values.firstName}
								onChange={(e) => update("firstName", e.target.value)}
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
								autoComplete="family-name"
								placeholder="Lovelace"
								value={values.lastName}
								onChange={(e) => update("lastName", e.target.value)}
								aria-invalid={Boolean(errors.lastName)}
							/>
						</FormField>
					</div>

					<FormField
						label="Email"
						htmlFor="email"
						error={errors.email}
						required
					>
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
						hint="At least 8 characters."
						required
					>
						<Input
							id="password"
							type="password"
							autoComplete="new-password"
							placeholder="••••••••"
							value={values.password}
							onChange={(e) => update("password", e.target.value)}
							aria-invalid={Boolean(errors.password)}
						/>
					</FormField>

					<Button type="submit" className="w-full" loading={register.isPending}>
						Create account
					</Button>
				</form>
			</CardPanel>
			<div className="border-t px-6 py-4 text-center text-muted-foreground text-sm">
				Already have an account?{" "}
				<Link
					href="/auth/login"
					className="font-medium text-foreground hover:underline"
				>
					Sign in
				</Link>
			</div>
		</Card>
	);
}
