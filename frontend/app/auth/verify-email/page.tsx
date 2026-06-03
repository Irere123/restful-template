"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
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

	// Already-verified users should not be here; unauthenticated users cannot be.
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
		<div>
			<div>
				<h1 className="font-semibold text-[30px] leading-9 tracking-normal text-foreground">
					Verify your email
				</h1>
				<p className="mt-3 text-base text-muted-foreground">
					{isLoading || !user ? (
						"Enter the 6-digit code we sent you."
					) : (
						<>
							Enter the 6-digit code we sent to{" "}
							<span className="font-semibold text-foreground">{user.email}</span>.
						</>
					)}
				</p>
			</div>

			<form
				className="mt-9 flex flex-col items-center gap-6"
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
				{error && <p className="text-destructive-foreground text-xs">{error}</p>}

				<Button
					type="submit"
					size="xl"
					className="h-11 w-full border-violet-600 bg-violet-600 text-white shadow-none hover:bg-violet-700"
					loading={verify.isPending}
					disabled={code.length !== 6}
				>
					Verify email
				</Button>
			</form>

			<div className="mt-8 flex flex-col items-center gap-2 text-center text-muted-foreground text-sm">
				<span>
					Didn&apos;t get a code?{" "}
					<button
						type="button"
						className="font-semibold text-violet-600 hover:text-violet-700 disabled:opacity-64"
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
					className="font-semibold text-violet-600 hover:text-violet-700"
				>
					Skip for now
				</Link>
			</div>
		</div>
	);
}
