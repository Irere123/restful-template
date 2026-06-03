import { detailRow, EmailLayout, paragraph } from "@notification/emails/layout";
import { Section, Text } from "@react-email/components";

export interface LogoutAlertEmailProps {
	displayName?: string;
	time?: string;
	allDevices?: boolean;
	appName?: string;
}

/**
 * Confirms a sign-out. When `allDevices` is set the message reflects that every
 * active session was revoked (the "sign out everywhere" action).
 */
export const LogoutAlertEmail = ({
	displayName,
	time,
	allDevices = false,
	appName = "TZW Fire Safety",
}: LogoutAlertEmailProps) => (
	<EmailLayout
		preview={
			allDevices
				? `You were signed out of all ${appName} devices`
				: `You were signed out of ${appName}`
		}
		heading={allDevices ? "Signed out of all devices" : "Signed out"}
		appName={appName}
	>
		<Text style={paragraph}>
			{displayName ? `Hi ${displayName}, ` : ""}
			{allDevices
				? `every active session for your ${appName} account has been signed out.`
				: `you've been signed out of your ${appName} account.`}
		</Text>
		<Section>
			{time ? (
				<Text style={detailRow}>
					<strong>Time:</strong> {time}
				</Text>
			) : null}
		</Section>
		<Text style={paragraph}>
			If you didn't perform this action, change your password right away — your
			credentials may be compromised.
		</Text>
	</EmailLayout>
);

export default LogoutAlertEmail;
