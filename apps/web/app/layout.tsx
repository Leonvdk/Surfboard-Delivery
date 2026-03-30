import { GoogleAnalytics } from "@next/third-parties/google";
import { DM_Sans, Sora } from "next/font/google";
import { EngagementTracker } from "./components/engagement-tracker";
import { Footer } from "./components/footer";
import { JsonLd } from "./components/json-ld";
import { Nav } from "./components/nav";
import { OutboundTracker } from "./components/outbound-tracker";
import { localBusinessJsonLd, siteNavigationJsonLd, webSiteJsonLd } from "./lib/jsonld";
import { baseMetadata } from "./lib/metadata";
import "./globals.css";

const sora = Sora({
	subsets: ["latin"],
	variable: "--font-sora",
	display: "swap",
});

const dmSans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-dm-sans",
	display: "swap",
});

export const metadata = baseMetadata;

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${sora.variable} ${dmSans.variable}`}>
			<GoogleAnalytics gaId="G-9NYPGY8VFQ" />
			<body>
				<JsonLd data={localBusinessJsonLd()} />
				<JsonLd data={webSiteJsonLd()} />
				<JsonLd data={siteNavigationJsonLd()} />
				<Nav />
				<main id="main-content">{children}</main>
				<Footer />
				<EngagementTracker />
				<OutboundTracker />
			</body>
		</html>
	);
}
