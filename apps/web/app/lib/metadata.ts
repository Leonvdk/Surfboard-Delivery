import type { Metadata } from "next";

const SITE_URL = "https://surfrental.pt";
const SITE_NAME = "SurfRental Aljezur";
const DEFAULT_DESCRIPTION =
	"Rent surfboards and wetsuits delivered to your accommodation in Aljezur, Arrifana, and Vale da Telha. Minimum one-week rental with free delivery and pickup on the Costa Vicentina.";

export const baseMetadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: "SurfRental Aljezur — Surfboard & Wetsuit Rental Delivered to Your Door",
		template: "%s | SurfRental Aljezur",
	},
	description: DEFAULT_DESCRIPTION,
	keywords: [
		"surf rental Aljezur",
		"surfboard rental Arrifana",
		"wetsuit rental Costa Vicentina",
		"surf gear delivery Portugal",
		"surfboard hire Vale da Telha",
		"surf equipment Algarve",
		"weekly surfboard rental",
		"surf holiday Aljezur",
		"Arrifana surf",
		"Monte Clérigo surf",
	],
	authors: [{ name: SITE_NAME }],
	creator: SITE_NAME,
	publisher: SITE_NAME,
	formatDetection: {
		email: false,
		address: false,
		telephone: true,
	},
	openGraph: {
		type: "website",
		locale: "en_GB",
		url: SITE_URL,
		siteName: SITE_NAME,
		title: "SurfRental Aljezur — Surfboard & Wetsuit Rental Delivered to Your Door",
		description: DEFAULT_DESCRIPTION,
		images: [
			{
				url: "/images/open-graph.jpg",
				width: 1200,
				height: 630,
				alt: "SurfRental Aljezur — Surfboard & Wetsuit Rental on the Costa Vicentina",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "SurfRental Aljezur — Surfboard & Wetsuit Rental Delivered",
		description: DEFAULT_DESCRIPTION,
		images: ["/images/open-graph.jpg"],
	},
	alternates: {
		canonical: SITE_URL,
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
};

export { SITE_NAME, SITE_URL };
