import { SITE_URL } from "./metadata";

const AGGREGATE_RATING = {
	"@type": "AggregateRating" as const,
	ratingValue: "4.9",
	reviewCount: "8",
	bestRating: "5",
	worstRating: "1",
};

export function localBusinessJsonLd() {
	return {
		"@context": "https://schema.org",
		"@type": "LocalBusiness",
		"@id": `${SITE_URL}/#business`,
		name: "Surf Rental Aljezur",
		description:
			"Surfboard and wetsuit rental with free delivery and pickup to your accommodation in Aljezur, Arrifana, and Vale da Telha on the Costa Vicentina, Portugal.",
		url: SITE_URL,
		logo: `${SITE_URL}/images/logo.png`,
		image: `${SITE_URL}/images/meta.jpg`,
		email: "hello@surfrental-aljezur.com",
		telephone: "+31613262259",
		aggregateRating: AGGREGATE_RATING,
		contactPoint: {
			"@type": "ContactPoint",
			telephone: "+31613262259",
			contactType: "reservations",
			availableLanguage: ["English", "Dutch", "Portuguese"],
		},
		areaServed: [
			{
				"@type": "Place",
				name: "Aljezur",
				address: { "@type": "PostalAddress", addressLocality: "Aljezur", addressCountry: "PT" },
			},
			{
				"@type": "Place",
				name: "Arrifana",
				address: { "@type": "PostalAddress", addressLocality: "Arrifana", addressCountry: "PT" },
			},
			{
				"@type": "Place",
				name: "Vale da Telha",
				address: {
					"@type": "PostalAddress",
					addressLocality: "Vale da Telha",
					addressCountry: "PT",
				},
			},
			{
				"@type": "Place",
				name: "Monte Clérigo",
				address: {
					"@type": "PostalAddress",
					addressLocality: "Monte Clérigo",
					addressCountry: "PT",
				},
			},
		],
		address: {
			"@type": "PostalAddress",
			addressLocality: "Aljezur",
			addressRegion: "Faro",
			addressCountry: "PT",
		},
		geo: {
			"@type": "GeoCoordinates",
			latitude: 37.3178,
			longitude: -8.8037,
		},
		priceRange: "€€",
		currenciesAccepted: "EUR",
		paymentAccepted: "Cash, MBWay, Bank Transfer",
		hasOfferCatalog: {
			"@type": "OfferCatalog",
			name: "Surf Gear Rental Packages",
			itemListElement: [
				{
					"@type": "Product",
					name: "Weekly Surfboard Rental",
					description: "Surfboard rental for 1 week with leash, wax, and free delivery and pickup.",
					category: "Surf Equipment Rental",
					aggregateRating: AGGREGATE_RATING,
					offers: {
						"@type": "Offer",
						price: "85",
						priceCurrency: "EUR",
						availability: "https://schema.org/InStock",
						priceValidUntil: "2026-12-31",
					},
				},
				{
					"@type": "Product",
					name: "Weekly Surfboard & Wetsuit Rental",
					description: "Surfboard and wetsuit rental for 1 week with free delivery and pickup.",
					category: "Surf Equipment Rental",
					aggregateRating: AGGREGATE_RATING,
					offers: {
						"@type": "Offer",
						price: "120",
						priceCurrency: "EUR",
						availability: "https://schema.org/InStock",
						priceValidUntil: "2026-12-31",
					},
				},
				{
					"@type": "Product",
					name: "Weekly Premium Surf Rental Bundle",
					description:
						"Complete surf trip bundle: surfboard, wetsuit, changing mat, and roof rack pads for 1 week with free delivery and pickup.",
					category: "Surf Equipment Rental",
					aggregateRating: AGGREGATE_RATING,
					offers: {
						"@type": "Offer",
						price: "150",
						priceCurrency: "EUR",
						availability: "https://schema.org/InStock",
						priceValidUntil: "2026-12-31",
					},
				},
				{
					"@type": "Product",
					name: "Daily Surfboard Rental",
					description: "Surfboard rental per day (3-day minimum) with free delivery and pickup.",
					category: "Surf Equipment Rental",
					aggregateRating: AGGREGATE_RATING,
					offers: {
						"@type": "Offer",
						price: "25",
						priceCurrency: "EUR",
						availability: "https://schema.org/InStock",
						priceValidUntil: "2026-12-31",
					},
				},
				{
					"@type": "Product",
					name: "Daily Surfboard & Wetsuit Rental",
					description:
						"Surfboard and wetsuit rental per day (3-day minimum) with free delivery and pickup.",
					category: "Surf Equipment Rental",
					aggregateRating: AGGREGATE_RATING,
					offers: {
						"@type": "Offer",
						price: "35",
						priceCurrency: "EUR",
						availability: "https://schema.org/InStock",
						priceValidUntil: "2026-12-31",
					},
				},
				{
					"@type": "Product",
					name: "Daily Premium Surf Rental Bundle",
					description:
						"Complete surf trip bundle per day (3-day minimum): surfboard, wetsuit, changing mat, and roof rack pads.",
					category: "Surf Equipment Rental",
					aggregateRating: AGGREGATE_RATING,
					offers: {
						"@type": "Offer",
						price: "45",
						priceCurrency: "EUR",
						availability: "https://schema.org/InStock",
						priceValidUntil: "2026-12-31",
					},
				},
				{
					"@type": "Product",
					name: "Two-Week Surfboard & Wetsuit Rental",
					description:
						"Surfboard and wetsuit rental for 2 weeks with free delivery, pickup, and a mid-stay board swap.",
					category: "Surf Equipment Rental",
					aggregateRating: AGGREGATE_RATING,
					offers: {
						"@type": "Offer",
						price: "199",
						priceCurrency: "EUR",
						availability: "https://schema.org/InStock",
						priceValidUntil: "2026-12-31",
					},
				},
			],
		},
	};
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: items.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: item.answer,
			},
		})),
	};
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: item.url,
		})),
	};
}

export function reviewJsonLd(reviews: Array<{ author: string; rating: number; body: string }>) {
	if (reviews.length === 0) return null;

	const ratingValues = reviews.map((r) => r.rating);
	const avg = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;

	return {
		"@context": "https://schema.org",
		"@type": "LocalBusiness",
		"@id": `${SITE_URL}/#business`,
		name: "Surf Rental Aljezur",
		aggregateRating: {
			"@type": "AggregateRating",
			ratingValue: avg.toFixed(1),
			reviewCount: reviews.length,
			bestRating: "5",
			worstRating: "1",
		},
		review: reviews.map((r) => ({
			"@type": "Review",
			author: { "@type": "Person", name: r.author },
			reviewRating: {
				"@type": "Rating",
				ratingValue: r.rating,
				bestRating: "5",
			},
			reviewBody: r.body,
		})),
	};
}

export function organizationJsonLd() {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: "Surf Rental Aljezur",
		url: SITE_URL,
		description:
			"Surfboard and wetsuit rental delivered to your accommodation in Aljezur, Arrifana, and Vale da Telha on the Costa Vicentina, Portugal.",
		address: {
			"@type": "PostalAddress",
			addressLocality: "Aljezur",
			addressRegion: "Faro",
			addressCountry: "PT",
		},
		areaServed: {
			"@type": "Place",
			name: "Costa Vicentina, Algarve, Portugal",
		},
	};
}

export function articleJsonLd({
	title,
	description,
	url,
	datePublished,
	dateModified,
}: {
	title: string;
	description: string;
	url: string;
	datePublished: string;
	dateModified?: string;
}) {
	return {
		"@context": "https://schema.org",
		"@type": "Article",
		headline: title,
		description,
		url,
		datePublished,
		dateModified: dateModified ?? datePublished,
		author: {
			"@type": "Organization",
			name: "Surf Rental Aljezur",
			url: SITE_URL,
		},
		publisher: {
			"@type": "Organization",
			name: "Surf Rental Aljezur",
			url: SITE_URL,
		},
	};
}

export function webSiteJsonLd() {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "Surf Rental Aljezur",
		url: SITE_URL,
		description:
			"Surfboard and wetsuit rental delivered to your accommodation in Aljezur, Arrifana, and Vale da Telha.",
	};
}

export function siteNavigationJsonLd() {
	const pages = [
		{ name: "Surfboards & Wetsuits", url: `${SITE_URL}/surf-gear` },
		{ name: "Pricing", url: `${SITE_URL}/pricing` },
		{ name: "How It Works", url: `${SITE_URL}/how-it-works` },
		{ name: "Reviews", url: `${SITE_URL}/reviews` },
		{ name: "Surf Spots", url: `${SITE_URL}/surf-spots` },
		{ name: "Blog", url: `${SITE_URL}/blog` },
		{ name: "Book Now", url: `${SITE_URL}/contact` },
	];

	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: "Site Navigation",
		itemListElement: pages.map((page, index) => ({
			"@type": "SiteNavigationElement",
			position: index + 1,
			name: page.name,
			url: page.url,
		})),
	};
}
