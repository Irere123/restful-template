"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardPanel,
	CardTitle,
} from "@/components/ui/card";
import { OTPField, OTPFieldInput } from "@/components/ui/otp-field";
import { useResendVerification, useVerifyEmail } from "@/lib/api/auth";
import { toast } from "@/lib/toast";

export default function VerifyEmailPage(): React.ReactElement {
	const router = useRouter();
	const { user, isLoading, isUnauthenticated } = useAuth();
	const verify = useVerifyEmail();
	const resend = useResendVerification();

	const [code, setCode] = useState("");
	const [error, setError] = useState("");

	// Already-verified users shouldn't be here; unauthenticated users can't be.
	useEffect(() => {
		if (isUnauthenticated) router.replace("/auth/login");
		else if (user?.emailVerified) router.replace("/dashboard");
	}, [isUnauthenticated, user?.emailVerified, router]);

	function submit(value: string): void {
		if (!/^\d{6}$/.test(value)) {
			setError("Enter the 6-digit code");
			return;
		}
		setError("");
		verify.mutate(value, {
			onSuccess: () => {
				toast.success("Email verified", "Your account is now fully active.");
				router.replace("/dashboard");
			},
			onError: (err) => {
				setCode("");
				toast.fromError(err, "Verification failed");
			},
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Verify your email</CardTitle>
				<CardDescription>
					{isLoading || !user ? (
						"Enter the 6-digit code we sent you."
					) : (
						<>
							Enter the 6-digit code we sent to{" "}
							<span className="font-medium text-foreground">{user.email}</span>.
						</>
					)}
				</CardDescription>
			</CardHeader>
			<CardPanel>
				<form
					className="flex flex-col items-center gap-5"
					onSubmit={(e) => {
						e.preventDefault();
						submit(code);
					}}
				>
					<OTPField
						length={6}
						value={code}
						onValueChange={(value) => {
							setCode(value);
							setError("");
						}}
						onValueComplete={(value) => submit(value)}
						aria-invalid={Boolean(error)}
					>
						{Array.from({ length: 6 }, (_, i) => (
							<OTPFieldInput key={i} />
						))}
					</OTPField>
					{error && (
						<p className="text-destructive-foreground text-xs">{error}</p>
					)}

					<Button
						type="submit"
						className="w-full"
						loading={verify.isPending}
						disabled={code.length !== 6}
					>
						Verify email
					</Button>
				</form>
			</CardPanel>
			<div className="flex flex-col items-center gap-1 border-t px-6 py-4 text-center text-muted-foreground text-sm">
				<span>
					Didn’t get a code?{" "}
					<button
						type="button"
						className="font-medium text-foreground hover:underline disabled:opacity-64"
						disabled={resend.isPending}
						onClick={() =>
							resend.mutate(undefined, {
								onSuccess: () =>
									toast.success(
										"Code sent",
										"Check your inbox for a new code.",
									),
								onError: (err) => toast.fromError(err),
							})
						}
					>
						Resend
					</button>
				</span>
				<Link
					href="/dashboard"
					className="hover:text-foreground hover:underline"
				>
					Skip for now
				</Link>
			</div>
		</Card>
	);
}
