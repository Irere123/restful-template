import { detailRow, EmailLayout, paragraph } from "@notification/emails/layout";
import { Section, Text } from "@react-email/components";

export interface MaintenanceLoggedEmailProps {
	displayName?: string;
	extinguisherSerial: string;
	actionTaken: string;
	date: string;
	notes?: string;
	appName?: string;
}

/** Confirms a maintenance activity has been recorded for an extinguisher. */
export const MaintenanceLoggedEmail = ({
	displayName,
	extinguisherSerial = "—",
	actionTaken = "—",
	date = "—",
	notes,
	appName = "TZW Fire Safety",
}: MaintenanceLoggedEmailProps) => (
	<EmailLayout
		preview={`Maintenance logged for extinguisher ${extinguisherSerial}`}
		heading="Maintenance recorded"
		appName={appName}
	>
		<Text style={paragraph}>
			{displayName ? `Hi ${displayName}, ` : ""}a maintenance activity has been
			logged for the following fire extinguisher.
		</Text>
		<Section>
			<Text style={detailRow}>
				<strong>Serial number:</strong> {extinguisherSerial}
			</Text>
			<Text style={detailRow}>
				<strong>Action taken:</strong> {actionTaken}
			</Text>
			<Text style={detailRow}>
				<strong>Date:</strong> {date}
			</Text>
			{notes ? (
				<Text style={detailRow}>
					<strong>Notes:</strong> {notes}
				</Text>
			) : null}
		</Section>
	</EmailLayout>
);

export default MaintenanceLoggedEmail;
