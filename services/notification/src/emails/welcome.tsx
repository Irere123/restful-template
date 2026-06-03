import { EmailLayout, paragraph } from "@notification/emails/layout";
import { Text } from "@react-email/components";

export interface WelcomeEmailProps {
	displayName?: string;
	appName?: string;
}

/** Greets a newly registered user and points them at email verification. */
export const WelcomeEmail = ({
	displayName,
	appName = "TZW Fire Safety",
}: WelcomeEmailProps) => (
	<EmailLayout
		preview={`Welcome to ${appName}`}
		heading={`Welcome to ${appName}`}
		appName={appName}
	>
		<Text style={paragraph}>
			{displayName ? `Hi ${displayName}, ` : "Hi, "}thanks for creating an
			account with {appName} — the fire-extinguisher compliance platform for
			TZW LTD.
		</Text>
		<Text style={paragraph}>
			We've sent a separate message with a verification code. Confirm your email
			to unlock the full dashboard: registering extinguishers, scheduling
			inspections and tracking compliance.
		</Text>
		<Text style={paragraph}>
			If you didn't create this account, you can safely ignore this email.
		</Text>
	</EmailLayout>
);

export default WelcomeEmail;
