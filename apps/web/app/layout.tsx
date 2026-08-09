import { DM_Sans, Sora } from "next/font/google";
import Script from "next/script";
import { Footer } from "./components/footer";
import { JsonLd } from "./components/json-ld";
import { Nav } from "./components/nav";
import { SiteAnalytics } from "./components/site-analytics";
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
			<body>
				{/* Google Consent Mode v2 — default state, set BEFORE GA config
					runs so gtag.js sees it first. Analytics is denied until the
					consent notice grants it (implied consent on staying). */}
				<Script id="ga-consent-default" strategy="beforeInteractive">
					{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=window.gtag||gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});`}
				</Script>
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
				{/* Public-site only — never loads on /admin. */}
				<SiteAnalytics gaId="G-9NYPGY8VFQ" />
			</body>
		</html>
	);
}
