import { detailRow, EmailLayout, paragraph } from "@notification/emails/layout";
import { Hr, Section, Text } from "@react-email/components";

export interface InspectionReminderItem {
	serialNumber: string;
	location?: string;
	scheduledDate: string;
	scheduledTime?: string;
}

export interface InspectionReminderEmailProps {
	displayName?: string;
	upcoming?: InspectionReminderItem[];
	overdue?: InspectionReminderItem[];
	appName?: string;
}

const itemRow = (item: InspectionReminderItem) => (
	<Section
		key={`${item.serialNumber}-${item.scheduledDate}`}
		style={itemSection}
	>
		<Text style={detailRow}>
			<strong>{item.serialNumber}</strong>
			{item.location ? ` · ${item.location}` : ""}
		</Text>
		<Text style={detailRow}>
			{item.scheduledDate}
			{item.scheduledTime ? ` at ${item.scheduledTime}` : ""}
		</Text>
	</Section>
);

/**
 * Daily reminder digest of inspections that are due soon or overdue. Produced by
 * the scheduled inspection-reminder cron job in the management service.
 */
export const InspectionReminderEmail = ({
	displayName,
	upcoming = [],
	overdue = [],
	appName = "TZW Fire Safety",
}: InspectionReminderEmailProps) => {
	const total = upcoming.length + overdue.length;
	return (
		<EmailLayout
			preview={`${total} inspection(s) need attention`}
			heading="Inspection reminders"
			appName={appName}
		>
			<Text style={paragraph}>
				{displayName ? `Hi ${displayName}, ` : ""}you have {total} scheduled
				inspection(s) that need attention.
			</Text>

			{overdue.length > 0 ? (
				<Section>
					<Text style={sectionHeading}>Overdue ({overdue.length})</Text>
					{overdue.map(itemRow)}
				</Section>
			) : null}

			{upcoming.length > 0 ? (
				<Section>
					{overdue.length > 0 ? <Hr style={divider} /> : null}
					<Text style={sectionHeading}>Due soon ({upcoming.length})</Text>
					{upcoming.map(itemRow)}
				</Section>
			) : null}

			<Text style={paragraph}>
				Please carry out these inspections and record their results to stay
				compliant.
			</Text>
		</EmailLayout>
	);
};

export default InspectionReminderEmail;

const sectionHeading: React.CSSProperties = {
	color: "#b91c1c",
	fontSize: "15px",
	fontWeight: 700,
	margin: "0 0 8px",
};

const itemSection: React.CSSProperties = {
	margin: "0 0 12px",
};

const divider: React.CSSProperties = {
	borderColor: "#e4e4e7",
	margin: "16px 0",
};
