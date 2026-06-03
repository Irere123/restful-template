import { Section, Text } from "@react-email/components";

import {
	codeBox,
	codeText,
	EmailLayout,
	paragraph,
} from "@notification/emails/layout";

export interface PasswordResetEmailProps {
	code: string;
	displayName?: string;
	appName?: string;
	ttlMinutes?: number;
}

/** Delivers a one-time code to reset a forgotten password. */
export const PasswordResetEmail = ({
	code = "000000",
	displayName,
	appName = "TZW Fire Safety",
	ttlMinutes = 10,
}: PasswordResetEmailProps) => (
	<EmailLayout
		preview={`${code} is your ${appName} password reset code`}
		heading="Reset your password"
		appName={appName}
	>
		<Text style={paragraph}>
			{displayName ? `Hi ${displayName}, ` : ""}we received a request to reset
			your {appName} password. Enter the code below to choose a new one.
		</Text>
		<Section style={codeBox}>
			<Text style={codeText}>{code}</Text>
		</Section>
		<Text style={paragraph}>
			This code expires in {ttlMinutes} minutes. If you didn’t request a reset,
			you can safely ignore this email — your password won’t change.
		</Text>
	</EmailLayout>
);

export default PasswordResetEmail;
