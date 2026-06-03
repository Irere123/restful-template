import { EmailLayout, paragraph } from "@notification/emails/layout";
import { Text } from "@react-email/components";

export interface AccountDeletedEmailProps {
	displayName?: string;
	/** True when an administrator removed the account rather than the user. */
	byAdmin?: boolean;
	appName?: string;
}

/** Confirms that an account has been permanently deleted. */
export const AccountDeletedEmail = ({
	displayName,
	byAdmin = false,
	appName = "TZW Fire Safety",
}: AccountDeletedEmailProps) => (
	<EmailLayout
		preview={`Your ${appName} account has been deleted`}
		heading="Account deleted"
		appName={appName}
	>
		<Text style={paragraph}>
			{displayName ? `Hi ${displayName}, ` : ""}your {appName} account has been
			permanently deleted
			{byAdmin ? " by an administrator" : ""}. All of your sessions have been
			revoked and you'll no longer be able to sign in.
		</Text>
		<Text style={paragraph}>
			{byAdmin
				? "If you believe this was a mistake, please contact your organisation's administrator."
				: "If you didn't request this, please contact your administrator immediately."}
		</Text>
	</EmailLayout>
);

export default AccountDeletedEmail;
