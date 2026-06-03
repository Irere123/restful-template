"use client";

import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
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
			<Card>
				<CardPanel className="flex flex-col items-center gap-4 py-10 text-center">
					<span className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
						<CheckCircle2Icon className="size-6" />
					</span>
					<div className="space-y-1">
						<CardTitle>Check your email</CardTitle>
						<CardDescription>
							If an account exists for{" "}
							<span className="font-medium text-foreground">{email}</span>,
							we’ve sent a password-reset code.
						</CardDescription>
					</div>
					<Button
						className="w-full"
						render={<Link href="/auth/reset-password" />}
					>
						Enter reset code
					</Button>
					<Link
						href="/auth/login"
						className="text-muted-foreground text-sm hover:text-foreground hover:underline"
					>
						Back to sign in
					</Link>
				</CardPanel>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Forgot password</CardTitle>
				<CardDescription>
					Enter your email and we’ll send you a code to reset it.
				</CardDescription>
			</CardHeader>
			<CardPanel>
				<form
					className="flex flex-col gap-4"
					onSubmit={handleSubmit}
					noValidate
				>
					<FormField label="Email" htmlFor="email" error={error}>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							placeholder="you@company.com"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								setError("");
							}}
							aria-invalid={Boolean(error)}
						/>
					</FormField>
					<Button type="submit" className="w-full" loading={forgot.isPending}>
						Send reset code
					</Button>
				</form>
			</CardPanel>
			<div className="border-t px-6 py-4 text-center text-muted-foreground text-sm">
				Remembered it?{" "}
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
