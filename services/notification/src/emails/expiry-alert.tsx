import { detailRow, EmailLayout, paragraph } from "@notification/emails/layout";
import { Section, Text } from "@react-email/components";

export interface ExpiryAlertEmailProps {
	displayName?: string;
	extinguisherSerial: string;
	location?: string;
	expiryDate: string;
	daysRemaining?: number;
	appName?: string;
}

/** Warns that a fire extinguisher is expired or about to expire. */
export const ExpiryAlertEmail = ({
	displayName,
	extinguisherSerial = "—",
	location,
	expiryDate = "—",
	daysRemaining,
	appName = "TZW Fire Safety",
}: ExpiryAlertEmailProps) => {
	const expired = typeof daysRemaining === "number" && daysRemaining <= 0;
	return (
		<EmailLayout
			preview={`Extinguisher ${extinguisherSerial} ${
				expired ? "has expired" : "is expiring soon"
			}`}
			heading={expired ? "Extinguisher expired" : "Extinguisher expiring soon"}
			appName={appName}
		>
			<Text style={paragraph}>
				{displayName ? `Hi ${displayName}, ` : ""}the following fire
				extinguisher {expired ? "has expired" : "is approaching its expiry"} and
				requires attention to maintain compliance.
			</Text>
			<Section>
				<Text style={detailRow}>
					<strong>Serial number:</strong> {extinguisherSerial}
				</Text>
				{location ? (
					<Text style={detailRow}>
						<strong>Location:</strong> {location}
					</Text>
				) : null}
				<Text style={detailRow}>
					<strong>Expiry date:</strong> {expiryDate}
				</Text>
				{typeof daysRemaining === "number" ? (
					<Text style={detailRow}>
						<strong>{expired ? "Days overdue" : "Days remaining"}:</strong>{" "}
						{Math.abs(daysRemaining)}
					</Text>
				) : null}
			</Section>
			<Text style={paragraph}>
				Please schedule a replacement or inspection as soon as possible.
			</Text>
		</EmailLayout>
	);
};

export default ExpiryAlertEmail;
