"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { registerFormSchema } from "@/lib/validation";

const EMPTY = { name: "", email: "", password: "" };

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
		const parts = values.name.trim().split(/\s+/).filter(Boolean);
		const formValues = {
			firstName: parts[0] ?? "",
			lastName: parts.slice(1).join(" "),
			email: values.email,
			password: values.password,
		};
		const parsed = registerFormSchema.safeParse(formValues);
		if (!parsed.success) {
			const next: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				const field = String(issue.path[0]);
				next[field === "firstName" || field === "lastName" ? "name" : field] =
					field === "lastName" ? "Enter first and last name" : issue.message;
			}
			setErrors(next);
			return;
		}

		register.mutate(parsed.data, {
			onSuccess: () => {
				toast.success(
					"Account created",
					"We've emailed you a 6-digit verification code.",
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
						setErrors({
							...err.fieldErrors,
							name:
								err.fieldErrors.firstName ??
								err.fieldErrors.lastName ??
								err.fieldErrors.name,
						});
						return;
					}
				}
				toast.fromError(err, "Couldn't create your account");
			},
		});
	}

	return (
		<div>
			<div>
				<h1 className="font-semibold text-[30px] leading-9 tracking-normal text-slate-950">
					Sign up
				</h1>
				<p className="mt-3 text-base text-slate-600">
					Start your 30-day free trial.
				</p>
			</div>

			<form className="mt-9 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
				<FormField label="Name" htmlFor="name" error={errors.name} required>
					<Input
						id="name"
						autoComplete="name"
						placeholder="Enter your name"
						size="lg"
						value={values.name}
						onChange={(e) => update("name", e.target.value)}
						aria-invalid={Boolean(errors.name)}
						className="rounded-lg border-slate-300 bg-white text-slate-950 shadow-sm"
					/>
				</FormField>

				<FormField label="Email" htmlFor="email" error={errors.email} required>
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
					label="Password"
					htmlFor="password"
					error={errors.password}
					hint="Must be at least 8 characters."
					required
				>
					<Input
						id="password"
						type="password"
						autoComplete="new-password"
						placeholder="Create a password"
						size="lg"
						value={values.password}
						onChange={(e) => update("password", e.target.value)}
						aria-invalid={Boolean(errors.password)}
						className="rounded-lg border-slate-300 bg-white text-slate-950 shadow-sm"
					/>
				</FormField>

				<Button
					type="submit"
					size="xl"
					className="mt-1 h-11 w-full border-violet-600 bg-violet-600 text-white shadow-none hover:bg-violet-700"
					loading={register.isPending}
				>
					Get started
				</Button>
			</form>

			<div className="mt-24 text-center text-slate-600 text-sm">
				Already have an account?{" "}
				<Link
					href="/auth/login"
					className="font-semibold text-violet-600 hover:text-violet-700"
				>
					Log in
				</Link>
			</div>
		</div>
	);
}
