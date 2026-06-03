import { detailRow, EmailLayout, paragraph } from "@notification/emails/layout";
import { Section, Text } from "@react-email/components";

export interface InspectionScheduledEmailProps {
	displayName?: string;
	extinguisherSerial: string;
	location?: string;
	date: string;
	time?: string;
	appName?: string;
}

/** Notifies relevant personnel that an inspection has been scheduled. */
export const InspectionScheduledEmail = ({
	displayName,
	extinguisherSerial = "—",
	location,
	date = "—",
	time,
	appName = "TZW Fire Safety",
}: InspectionScheduledEmailProps) => (
	<EmailLayout
		preview={`Inspection scheduled for extinguisher ${extinguisherSerial}`}
		heading="Inspection scheduled"
		appName={appName}
	>
		<Text style={paragraph}>
			{displayName ? `Hi ${displayName}, ` : ""}an inspection has been scheduled
			for the following fire extinguisher.
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
				<strong>Date:</strong> {date}
			</Text>
			{time ? (
				<Text style={detailRow}>
					<strong>Time:</strong> {time}
				</Text>
			) : null}
		</Section>
		<Text style={paragraph}>
			Please ensure the extinguisher is accessible at the scheduled time.
		</Text>
	</EmailLayout>
);

export default InspectionScheduledEmail;
