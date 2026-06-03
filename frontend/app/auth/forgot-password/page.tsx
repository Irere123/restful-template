"use client";

import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/lib/api/auth";
import { toast } from "@/lib/toast";
import { forgotPasswordFormSchema } from "@/lib/validation";

export default function ForgotPasswordPage(): React.ReactElement {
	const forgot = useForgotPassword();
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [sent, setSent] = useState(false);

	function handleSubmit(event: React.FormEvent): void {
		event.preventDefault();
		const parsed = forgotPasswordFormSchema.safeParse({ email });
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "Enter a valid email");
			return;
		}
		setError("");
		forgot.mutate(parsed.data.email, {
			onSuccess: () => setSent(true),
			onError: (err) => toast.fromError(err),
		});
	}

	if (sent) {
		return (
			<div className="text-center">
				<span className="mx-auto flex size-11 items-center justify-center rounded-full bg-success/10 text-success-foreground">
					<CheckCircle2Icon className="size-6" />
				</span>
				<h1 className="mt-5 font-semibold text-[30px] leading-9 tracking-normal text-foreground">
					Check your email
				</h1>
				<p className="mt-3 text-base text-muted-foreground">
					If an account exists for{" "}
					<span className="font-semibold text-foreground">{email}</span>, we&apos;ve
					sent a password-reset code.
				</p>
				<Button
					size="xl"
					className="mt-8 h-11 w-full border-violet-600 bg-violet-600 text-white shadow-none hover:bg-violet-700"
					render={<Link href="/auth/reset-password" />}
				>
					Enter reset code
				</Button>
				<Link
					href="/auth/login"
					className="mt-6 inline-flex font-semibold text-sm text-violet-600 hover:text-violet-700"
				>
					Back to sign in
				</Link>
			</div>
		);
	}

	return (
		<div>
			<div>
				<h1 className="font-semibold text-[30px] leading-9 tracking-normal text-foreground">
					Forgot password
				</h1>
				<p className="mt-3 text-base text-muted-foreground">
					Enter your email and we&apos;ll send you a code to reset it.
				</p>
			</div>

			<form className="mt-9 flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
				<FormField label="Email" htmlFor="email" error={error}>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						placeholder="Enter your email"
						size="lg"
						value={email}
						onChange={(e) => {
							setEmail(e.target.value);
							setError("");
						}}
						aria-invalid={Boolean(error)}
						className="rounded-lg shadow-sm"
					/>
				</FormField>
				<Button
					type="submit"
					size="xl"
					className="h-11 w-full border-violet-600 bg-violet-600 text-white shadow-none hover:bg-violet-700"
					loading={forgot.isPending}
				>
					Send reset code
				</Button>
			</form>

			<div className="mt-8 text-center text-muted-foreground text-sm">
				Remembered it?{" "}
				<Link
					href="/auth/login"
					className="font-semibold text-violet-600 hover:text-violet-700"
				>
					Sign in
				</Link>
			</div>
		</div>
	);
}
