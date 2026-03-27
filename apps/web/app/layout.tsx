import { GoogleAnalytics } from "@next/third-parties/google";
import { DM_Sans, Syne } from "next/font/google";
import { Footer } from "./components/footer";
import { JsonLd } from "./components/json-ld";
import { Nav } from "./components/nav";
import { localBusinessJsonLd, webSiteJsonLd } from "./lib/jsonld";
import { baseMetadata } from "./lib/metadata";
import "./globals.css";

const syne = Syne({
	subsets: ["latin"],
	variable: "--font-syne",
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
		<html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
			<GoogleAnalytics gaId="G-9NYPGY8VFQ" />
			<body>
				<JsonLd data={localBusinessJsonLd()} />
				<JsonLd data={webSiteJsonLd()} />
				<Nav />
				<main id="main-content">{children}</main>
				<Footer />
			</body>
		</html>
	);
}
