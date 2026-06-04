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
				const field = String(issue.path[0]);
				if (next[field] === undefined) next[field] = issue.message;
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
						setErrors(err.fieldErrors);
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
				<h1 className="font-semibold text-[30px] leading-9 tracking-normal text-foreground">
					Sign up
				</h1>
				<p className="mt-3 text-base text-muted-foreground">
					Start your 30-day free trial.
				</p>
			</div>

			<form className="mt-9 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
					<FormField
						label="First name"
						htmlFor="firstName"
						error={errors.firstName}
						required
					>
						<Input
							id="firstName"
							autoComplete="given-name"
							placeholder="Enter your first name"
							size="lg"
							value={values.firstName}
							onChange={(e) => update("firstName", e.target.value)}
							aria-invalid={Boolean(errors.firstName)}
							className="rounded-lg shadow-sm"
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
							placeholder="Enter your last name"
							size="lg"
							value={values.lastName}
							onChange={(e) => update("lastName", e.target.value)}
							aria-invalid={Boolean(errors.lastName)}
							className="rounded-lg shadow-sm"
						/>
					</FormField>
				</div>

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
						className="rounded-lg shadow-sm"
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
						className="rounded-lg shadow-sm"
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

			<div className="mt-24 text-center text-muted-foreground text-sm">
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
