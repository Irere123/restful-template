import {
	codeBox,
	codeText,
	EmailLayout,
	paragraph,
} from "@notification/emails/layout";
import { Section, Text } from "@react-email/components";

export interface OtpVerificationEmailProps {
	code: string;
	displayName?: string;
	appName?: string;
	ttlMinutes?: number;
}

/** Delivers a one-time code to confirm a newly registered email address. */
export const OtpVerificationEmail = ({
	code = "000000",
	displayName,
	appName = "TZW Fire Safety",
	ttlMinutes = 10,
}: OtpVerificationEmailProps) => (
	<EmailLayout
		preview={`${code} is your ${appName} verification code`}
		heading="Verify your email"
		appName={appName}
	>
		<Text style={paragraph}>
			{displayName ? `Hi ${displayName}, ` : ""}use the code below to confirm
			your email address and finish setting up your {appName} account.
		</Text>
		<Section style={codeBox}>
			<Text style={codeText}>{code}</Text>
		</Section>
		<Text style={paragraph}>
			This code expires in {ttlMinutes} minutes. If you didn’t request it, you
			can safely ignore this email.
		</Text>
	</EmailLayout>
);

export default OtpVerificationEmail;
