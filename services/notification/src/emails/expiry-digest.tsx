import { detailRow, EmailLayout, paragraph } from "@notification/emails/layout";
import { Hr, Section, Text } from "@react-email/components";

export interface ExpiryDigestItem {
	serialNumber: string;
	location?: string;
	expiryDate: string;
	daysRemaining?: number;
}

export interface ExpiryDigestEmailProps {
	displayName?: string;
	expiringSoon?: ExpiryDigestItem[];
	expired?: ExpiryDigestItem[];
	appName?: string;
}

const itemRow = (item: ExpiryDigestItem, expired: boolean) => (
	<Section key={`${item.serialNumber}-${item.expiryDate}`} style={itemSection}>
		<Text style={detailRow}>
			<strong>{item.serialNumber}</strong>
			{item.location ? ` · ${item.location}` : ""}
		</Text>
		<Text style={detailRow}>
			Expiry: {item.expiryDate}
			{typeof item.daysRemaining === "number"
				? expired
					? ` · ${Math.abs(item.daysRemaining)} day(s) overdue`
					: ` · ${item.daysRemaining} day(s) remaining`
				: ""}
		</Text>
	</Section>
);

/**
 * Daily compliance digest emailed to administrators/inspectors, summarising the
 * extinguishers that have expired or are about to. Produced by the scheduled
 * expiry-scan cron job in the management service.
 */
export const ExpiryDigestEmail = ({
	displayName,
	expiringSoon = [],
	expired = [],
	appName = "TZW Fire Safety",
}: ExpiryDigestEmailProps) => {
	const total = expiringSoon.length + expired.length;
	return (
		<EmailLayout
			preview={`${total} extinguisher(s) need attention`}
			heading="Extinguisher expiry digest"
			appName={appName}
		>
			<Text style={paragraph}>
				{displayName ? `Hi ${displayName}, ` : ""}the daily compliance scan found{" "}
				{total} extinguisher(s) that need attention.
			</Text>

			{expired.length > 0 ? (
				<Section>
					<Text style={sectionHeading}>Expired ({expired.length})</Text>
					{expired.map((item) => itemRow(item, true))}
				</Section>
			) : null}

			{expiringSoon.length > 0 ? (
				<Section>
					{expired.length > 0 ? <Hr style={divider} /> : null}
					<Text style={sectionHeading}>
						Expiring soon ({expiringSoon.length})
					</Text>
					{expiringSoon.map((item) => itemRow(item, false))}
				</Section>
			) : null}

			<Text style={paragraph}>
				Please schedule replacements or inspections to keep the fleet compliant.
			</Text>
		</EmailLayout>
	);
};

export default ExpiryDigestEmail;

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
