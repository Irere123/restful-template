import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";

export interface OtpVerificationEmailProps {
	code: string;
	appName?: string;
	ttlMinutes?: number;
}

/**
 * Transactional email that delivers a one-time verification code. Rendered to
 * HTML by {@link sendOtpEmail}. Styles are inline because email clients ignore
 * external/`<style>` CSS.
 */
export const OtpVerificationEmail = ({
	code = "000000",
	appName = "Acme",
	ttlMinutes = 10,
}: OtpVerificationEmailProps) => (
	<Html>
		<Head />
		<Preview>
			{code} is your {appName} verification code
		</Preview>
		<Body style={main}>
			<Container style={container}>
				<Heading style={heading}>Verify your email</Heading>
				<Text style={paragraph}>
					Use the code below to confirm your email address and finish setting up
					your {appName} account.
				</Text>
				<Section style={codeBox}>
					<Text style={codeText}>{code}</Text>
				</Section>
				<Text style={paragraph}>
					This code expires in {ttlMinutes} minutes. If you didn’t request it,
					you can safely ignore this email.
				</Text>
				<Text style={footer}>
					{appName} · Please don’t reply to this automated message.
				</Text>
			</Container>
		</Body>
	</Html>
);

export default OtpVerificationEmail;

const main: React.CSSProperties = {
	backgroundColor: "#f4f4f5",
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
	padding: "32px 0",
};

const container: React.CSSProperties = {
	backgroundColor: "#ffffff",
	borderRadius: "12px",
	margin: "0 auto",
	maxWidth: "440px",
	padding: "40px",
};

const heading: React.CSSProperties = {
	color: "#18181b",
	fontSize: "22px",
	fontWeight: 700,
	margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
	color: "#3f3f46",
	fontSize: "15px",
	lineHeight: "24px",
	margin: "0 0 16px",
};

const codeBox: React.CSSProperties = {
	backgroundColor: "#f4f4f5",
	borderRadius: "8px",
	margin: "8px 0 24px",
	padding: "16px",
	textAlign: "center",
};

const codeText: React.CSSProperties = {
	color: "#18181b",
	fontSize: "32px",
	fontWeight: 700,
	letterSpacing: "8px",
	margin: 0,
};

const footer: React.CSSProperties = {
	color: "#a1a1aa",
	fontSize: "12px",
	lineHeight: "16px",
	margin: "24px 0 0",
};
