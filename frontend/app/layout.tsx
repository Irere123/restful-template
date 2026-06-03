import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Agentation } from "agentation";

import { Providers } from "@/app/providers";
import { cn } from "@/lib/utils";

const interHeading = Inter({ subsets: ["latin"], variable: "--font-heading" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "TZW Fire Safety — Extinguisher Management",
	description:
		"Track fire extinguishers, schedule inspections, log maintenance and monitor compliance.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={cn(
				"h-full",
				"antialiased",
				geistSans.variable,
				geistMono.variable,
				"font-sans",
				inter.variable,
				interHeading.variable,
			)}
		>
			<body className="min-h-full flex flex-col">
				<Providers>{children}</Providers>
				{process.env.NODE_ENV === "development" && <Agentation />}
			</body>
		</html>
	);
}
