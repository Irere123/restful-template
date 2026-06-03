import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Text,
} from "@react-email/components";
import type { ReactNode } from "react";

export interface EmailLayoutProps {
	preview: string;
	heading: string;
	appName?: string;
	children: ReactNode;
}

/**
 * Shared chrome for every transactional email — consistent header, container
 * and footer. Styles are inline because email clients ignore external/`<style>`
 * CSS.
 */
export const EmailLayout = ({
	preview,
	heading,
	appName = "TZW Fire Safety",
	children,
}: EmailLayoutProps) => (
	<Html>
		<Head />
		<Preview>{preview}</Preview>
		<Body style={main}>
			<Container style={container}>
				<Heading style={headingStyle}>{heading}</Heading>
				{children}
				<Text style={footer}>
					{appName} · Please don’t reply to this automated message.
				</Text>
			</Container>
		</Body>
	</Html>
);

export default EmailLayout;

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
	maxWidth: "460px",
	padding: "40px",
};

const headingStyle: React.CSSProperties = {
	color: "#b91c1c",
	fontSize: "22px",
	fontWeight: 700,
	margin: "0 0 16px",
};

const footer: React.CSSProperties = {
	color: "#a1a1aa",
	fontSize: "12px",
	lineHeight: "16px",
	margin: "24px 0 0",
};

export const paragraph: React.CSSProperties = {
	color: "#3f3f46",
	fontSize: "15px",
	lineHeight: "24px",
	margin: "0 0 16px",
};

export const codeBox: React.CSSProperties = {
	backgroundColor: "#f4f4f5",
	borderRadius: "8px",
	margin: "8px 0 24px",
	padding: "16px",
	textAlign: "center",
};

export const codeText: React.CSSProperties = {
	color: "#18181b",
	fontSize: "32px",
	fontWeight: 700,
	letterSpacing: "8px",
	margin: 0,
};

export const detailRow: React.CSSProperties = {
	color: "#3f3f46",
	fontSize: "14px",
	lineHeight: "22px",
	margin: "0 0 4px",
};
