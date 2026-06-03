"use client";

import { MailWarningIcon } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/providers/auth-provider";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useResendVerification } from "@/lib/api/auth";
import { toast } from "@/lib/toast";

/** Persistent nudge shown across the app until the user verifies their email. */
export function VerifyEmailBanner(): React.ReactElement | null {
	const { user } = useAuth();
	const resend = useResendVerification();

	if (!user || user.emailVerified) return null;

	return (
		<Alert variant="warning">
			<MailWarningIcon />
			<AlertDescription>
				Your email isn’t verified yet. Verify it to secure your account.
			</AlertDescription>
			<AlertAction>
				<Button
					size="sm"
					variant="outline"
					loading={resend.isPending}
					onClick={() =>
						resend.mutate(undefined, {
							onSuccess: () => toast.success("Verification code sent"),
							onError: (err) => toast.fromError(err),
						})
					}
				>
					Resend code
				</Button>
				<Button size="sm" render={<Link href="/auth/verify-email" />}>
					Verify now
				</Button>
			</AlertAction>
		</Alert>
	);
}
