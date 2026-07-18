import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { DM_Sans, Sora } from "next/font/google";
import { EngagementTracker } from "./components/engagement-tracker";
import { Footer } from "./components/footer";
import { JsonLd } from "./components/json-ld";
import { Nav } from "./components/nav";
import { OutboundTracker } from "./components/outbound-tracker";
import { SiteChrome } from "./components/site-chrome";
import { WhatsAppFloat } from "./components/whatsapp-float";
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
				<SiteChrome>
					<Nav />
				</SiteChrome>
				<main id="main-content">{children}</main>
				<SiteChrome>
					<Footer />
					<WhatsAppFloat />
				</SiteChrome>
				<EngagementTracker />
				<OutboundTracker />
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
