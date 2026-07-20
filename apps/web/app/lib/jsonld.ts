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
		"@type": ["LocalBusiness", "SportingGoodsStore"],
		"@id": `${SITE_URL}/#business`,
		name: "Surf Rental Aljezur",
		description:
			"Surfboard and wetsuit rental with free delivery and pickup to your accommodation in Aljezur, Arrifana, Vale da Telha, Monte Clérigo, and Carrapateira on the Costa Vicentina, Portugal.",
		url: SITE_URL,
		logo: `${SITE_URL}/images/logo.png`,
		image: `${SITE_URL}/images/meta.jpg`,
		email: "hello@surfrental-aljezur.com",
		telephone: "+31613262259",
		founder: { "@id": `${SITE_URL}/#leon` },
		aggregateRating: AGGREGATE_RATING,
		contactPoint: {
			"@type": "ContactPoint",
			telephone: "+31613262259",
			contactType: "reservations",
			availableLanguage: ["English", "Dutch", "Portuguese", "German", "French"],
		},
		openingHoursSpecification: [
			{
				"@type": "OpeningHoursSpecification",
				dayOfWeek: [
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
					"Saturday",
					"Sunday",
				],
				opens: "08:00",
				closes: "20:00",
			},
		],
		serviceArea: {
			"@type": "GeoCircle",
			geoMidpoint: {
				"@type": "GeoCoordinates",
				latitude: 37.3178,
				longitude: -8.8037,
			},
			geoRadius: "15000",
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
			{
				"@type": "Place",
				name: "Carrapateira",
				address: {
					"@type": "PostalAddress",
					addressLocality: "Carrapateira",
					addressCountry: "PT",
				},
			},
		],
		address: {
			"@type": "PostalAddress",
			addressLocality: "Aljezur",
			addressRegion: "Faro",
			postalCode: "8670",
			addressCountry: "PT",
		},
		geo: {
			"@type": "GeoCoordinates",
			latitude: 37.3178,
			longitude: -8.8037,
		},
		priceRange: "€18–€38 per day",
		currenciesAccepted: "EUR",
		paymentAccepted:
			"Cash, Card, Apple Pay, iDEAL, Wero, MB WAY, Bank Transfer",
		sameAs: [
			// TODO(Leon): fill in as public profiles come online. GBP goes in
			// its own knowledge-graph link, not here.
			"https://www.instagram.com/surfrental.aljezur/",
			"https://www.facebook.com/surfrental.aljezur/",
		],
		hasOfferCatalog: {
			"@type": "OfferCatalog",
			name: "Surfboard & Wetsuit Rental Packages",
			itemListElement: [
				{
					"@type": "Offer",
					itemOffered: {
						"@type": "Service",
						name: "Board Only Rental",
						serviceType: "Surfboard rental",
						provider: { "@id": `${SITE_URL}/#business` },
						areaServed: "Costa Vicentina, Portugal",
					},
					price: "18",
					priceCurrency: "EUR",
				},
				{
					"@type": "Offer",
					itemOffered: {
						"@type": "Service",
						name: "Full Package Rental (Board + Wetsuit)",
						serviceType: "Surfboard and wetsuit rental",
						provider: { "@id": `${SITE_URL}/#business` },
						areaServed: "Costa Vicentina, Portugal",
					},
					price: "28",
					priceCurrency: "EUR",
				},
				{
					"@type": "Offer",
					itemOffered: {
						"@type": "Service",
						name: "Premium Package Rental (Board + Wetsuit + Mid-Stay Swap)",
						serviceType: "Surfboard and wetsuit rental with mid-stay board swap",
						provider: { "@id": `${SITE_URL}/#business` },
						areaServed: "Costa Vicentina, Portugal",
					},
					price: "38",
					priceCurrency: "EUR",
				},
			],
		},
		makesOffer: [
			{
				"@type": "Offer",
				name: "Board Only Rental",
				description: "Surfboard rental with leash, wax, and free delivery and pickup. Three-day minimum.",
				price: "18",
				priceCurrency: "EUR",
				priceSpecification: {
					"@type": "UnitPriceSpecification",
					price: "18",
					priceCurrency: "EUR",
					unitCode: "DAY",
				},
				availability: "https://schema.org/InStock",
				priceValidUntil: "2027-12-31",
			},
			{
				"@type": "Offer",
				name: "Full Package Rental (Board + Wetsuit)",
				description: "Surfboard and wetsuit rental with free delivery and pickup. Three-day minimum.",
				price: "28",
				priceCurrency: "EUR",
				priceSpecification: {
					"@type": "UnitPriceSpecification",
					price: "28",
					priceCurrency: "EUR",
					unitCode: "DAY",
				},
				availability: "https://schema.org/InStock",
				priceValidUntil: "2027-12-31",
			},
			{
				"@type": "Offer",
				name: "Premium Package Rental (Board + Wetsuit + Mid-Stay Swap)",
				description: "Surfboard, wetsuit, and a free mid-stay board swap on day two so you can change your board once you know the waves. Free delivery and pickup. Three-day minimum.",
				price: "38",
				priceCurrency: "EUR",
				priceSpecification: {
					"@type": "UnitPriceSpecification",
					price: "38",
					priceCurrency: "EUR",
					unitCode: "DAY",
				},
				availability: "https://schema.org/InStock",
				priceValidUntil: "2027-12-31",
			},
		],
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

export function howToJsonLd({
	name,
	description,
	steps,
	totalTime,
}: {
	name: string;
	description: string;
	steps: Array<{ name: string; text: string; url?: string }>;
	totalTime?: string;
}) {
	return {
		"@context": "https://schema.org",
		"@type": "HowTo",
		name,
		description,
		...(totalTime ? { totalTime } : {}),
		step: steps.map((s, i) => ({
			"@type": "HowToStep",
			position: i + 1,
			name: s.name,
			text: s.text,
			...(s.url ? { url: s.url } : {}),
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

export function reviewJsonLd(
	reviews: Array<{
		author: string;
		rating: number;
		body: string;
		country?: string;
		type?: string;
		datePublished?: string;
	}>,
) {
	if (reviews.length === 0) return null;

	// Returns an array of Review objects each referencing the LocalBusiness by
	// @id — no wrapping LocalBusiness node, no `publisher` field. Avoids a
	// duplicate aggregateRating on the same @id (root layout's
	// localBusinessJsonLd already carries the aggregate) and the "publisher =
	// item reviewed" self-serving pattern Google penalises.
	return reviews.map((r) => ({
		"@context": "https://schema.org",
		"@type": "Review",
		author: {
			"@type": "Person",
			name: r.author,
			...(r.country
				? {
						address: {
							"@type": "PostalAddress",
							addressCountry: r.country,
						},
					}
				: {}),
		},
		reviewRating: {
			"@type": "Rating",
			ratingValue: r.rating,
			bestRating: "5",
			worstRating: "1",
		},
		reviewBody: r.body,
		...(r.datePublished ? { datePublished: r.datePublished } : {}),
		itemReviewed: {
			"@type": "LocalBusiness",
			"@id": `${SITE_URL}/#business`,
			name: "Surf Rental Aljezur",
		},
	}));
}

export function personJsonLd() {
	return {
		"@context": "https://schema.org",
		"@type": "Person",
		"@id": `${SITE_URL}/#leon`,
		name: "Leon van de Klundert",
		givenName: "Leon",
		familyName: "van de Klundert",
		jobTitle: "Owner, Surf Rental Aljezur",
		description:
			"Runs Surf Rental Aljezur. Lives in Aljezur and delivers surf gear across the Costa Vicentina.",
		worksFor: {
			"@type": "LocalBusiness",
			"@id": `${SITE_URL}/#business`,
			name: "Surf Rental Aljezur",
			url: SITE_URL,
		},
		homeLocation: {
			"@type": "Place",
			name: "Aljezur, Portugal",
			address: {
				"@type": "PostalAddress",
				addressLocality: "Aljezur",
				addressRegion: "Faro",
				addressCountry: "PT",
			},
		},
		knowsAbout: [
			"surfing",
			"surf gear rental",
			"Costa Vicentina",
			"Aljezur",
			"Portugal surf spots",
		],
		knowsLanguage: ["English", "Dutch", "Portuguese"],
		url: `${SITE_URL}/about`,
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
	image,
}: {
	title: string;
	description: string;
	url: string;
	datePublished: string;
	dateModified?: string;
	image?: string;
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
			"@type": "Person",
			"@id": `${SITE_URL}/#leon`,
			name: "Leon van de Klundert",
			url: `${SITE_URL}/about`,
		},
		publisher: {
			"@type": "Organization",
			"@id": `${SITE_URL}/#business`,
			name: "Surf Rental Aljezur",
			url: SITE_URL,
			logo: {
				"@type": "ImageObject",
				url: `${SITE_URL}/images/logo.png`,
				width: 600,
				height: 60,
			},
		},
		image: image ? [image] : [`${SITE_URL}/images/meta.jpg`],
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": url,
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
