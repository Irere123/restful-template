import { detailRow, EmailLayout, paragraph } from "@notification/emails/layout";
import { Section, Text } from "@react-email/components";

export interface LoginAlertEmailProps {
	displayName?: string;
	time?: string;
	ipAddress?: string;
	userAgent?: string;
	appName?: string;
}

/**
 * Security notice sent when a new sign-in is detected, so the account owner can
 * react to access they don't recognise.
 */
export const LoginAlertEmail = ({
	displayName,
	time,
	ipAddress,
	userAgent,
	appName = "TZW Fire Safety",
}: LoginAlertEmailProps) => (
	<EmailLayout
		preview={`New sign-in to your ${appName} account`}
		heading="New sign-in detected"
		appName={appName}
	>
		<Text style={paragraph}>
			{displayName ? `Hi ${displayName}, ` : ""}your {appName} account was just
			signed in to. If this was you, no action is needed.
		</Text>
		<Section>
			{time ? (
				<Text style={detailRow}>
					<strong>Time:</strong> {time}
				</Text>
			) : null}
			{ipAddress ? (
				<Text style={detailRow}>
					<strong>IP address:</strong> {ipAddress}
				</Text>
			) : null}
			{userAgent ? (
				<Text style={detailRow}>
					<strong>Device:</strong> {userAgent}
				</Text>
			) : null}
		</Section>
		<Text style={paragraph}>
			If you don't recognise this activity, change your password immediately and
			sign out of all devices from your account settings.
		</Text>
	</EmailLayout>
);

export default LoginAlertEmail;
