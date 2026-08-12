import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "../components/cta-section";
import { JsonLd } from "../components/json-ld";
import { PricingToggle } from "../components/pricing-toggle";
import { HorizonLine, Reveal } from "../components/reveal";
import { faqJsonLd, PRICE_VALID_UNTIL } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";
import { prices } from "../lib/pricing";

// Question + answer text must match the visible FAQ below verbatim — Google
// drops the FAQ rich result when the schema and the page disagree.
const pricingFaqs = [
	{
		question: "What's the minimum rental period?",
		answer:
			"Daily rentals have a 3-day minimum. Weekly rentals run for 7 days. For stays longer than 2 weeks, contact us for a custom rate.",
	},
	{
		question: "Can I upgrade my package mid-rental?",
		answer:
			"Yes. If you start with a Board Only and decide you need a wetsuit, just let us know and we'll arrange a swap delivery.",
	},
	{
		question: "Is delivery really free?",
		answer:
			"Yes — delivery and pickup are included in every package at no extra cost. We deliver to accommodations in Aljezur, Arrifana, Vale da Telha, and Monte Clérigo.",
	},
	{
		question: "Do you offer group discounts?",
		answer:
			"Groups of 3–5 people save approximately 12% per person. For groups of 6 or more, we offer custom quotes. See our group bookings page for details.",
	},
];

export const metadata: Metadata = {
	title: "Pricing — Daily & Weekly Surf Rental Packages",
	description:
		"Surfboard and wetsuit rental from \u20AC18/day or \u20AC100/week board-only, \u20AC28/day or \u20AC150/week with wetsuit. Three-day minimum. Free delivery in Aljezur, Arrifana, Vale da Telha, Monte Clérigo, and Carrapateira.",
	alternates: { canonical: "/pricing" },
	openGraph: {
		title: "Pricing — Daily & Weekly Surf Rental Packages | Surf Rental Aljezur",
		description:
			"Surfboard and wetsuit rental from \u20AC18/day or \u20AC100/week with free delivery on the Costa Vicentina. Three-day minimum.",
		url: `${SITE_URL}/pricing`,
	},
};

export default function PricingPage() {
	return (
		<>
			<JsonLd data={pricingProductJsonLd()} />
			<JsonLd data={faqJsonLd(pricingFaqs)} />

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>Surf rental prices in Aljezur — from €18/day, €100/week</h1>
							<p className="page-hero-sub">
								Board-only rental is <strong>€18/day or €100/week</strong>.
								Board + wetsuit is <strong>€28/day or €150/week</strong>.
								Three-day minimum,
								free delivery and pickup across Aljezur, Arrifana, Vale da
								Telha, Monte Clérigo, and Carrapateira. Not sure which gear
								to pick? Check our{" "}
								<Link href="/surf-gear">boards &amp; wetsuits</Link> page.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="packages-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Rental packages</p>
							<h2 className="section-title" id="packages-heading">
								Choose your package
							</h2>
						</div>
					</Reveal>
					<Reveal>
						<PricingToggle />
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			{/* Extended stay callout */}
			<section className="section section-alt" aria-labelledby="extended-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Staying longer?</p>
							<h2 className="section-title" id="extended-heading">
								2-week rates
							</h2>
							<p className="section-desc">
								Book for two weeks and save even more.
							</p>
						</div>
					</Reveal>
					<Reveal>
						<div className="extended-pricing-row">
							<div className="extended-price-item">
								<span className="extended-label">Board Only</span>
								<span className="extended-amount">&euro;{prices.boardOnly.extended.amount}</span>
								<span className="extended-period">2 weeks</span>
							</div>
							<div className="extended-price-item featured">
								<span className="extended-label">Full Package</span>
								<span className="extended-amount">&euro;{prices.fullPackage.extended.amount}</span>
								<span className="extended-period">2 weeks</span>
							</div>
						</div>
					</Reveal>
					<Reveal>
						<div className="pricing-note-row">
							<p className="pricing-note">
								Staying even longer? <Link href="/contact">Get in touch</Link> for a custom rate.
							</p>
							<p className="pricing-note">
								Travelling with a group? Check our{" "}
								<Link href="/group-bookings">group discounts</Link>.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="includes-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">What&apos;s included</p>
							<h2 className="section-title" id="includes-heading">
								Every rental includes
							</h2>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="grid-3">
							<article className="gear-card">
								<h3>Free delivery &amp; pickup</h3>
								<p>
									We bring the gear to your accommodation in Aljezur, Arrifana,
									Vale da Telha, or Monte Cl&eacute;rigo — and collect it when
									you&apos;re done.
								</p>
							</article>
							<article className="gear-card">
								<h3>Leash, wax &amp; fins</h3>
								<p>
									Every board comes ready to ride. Leash attached, freshly waxed,
									fins installed. Just grab it and go.
								</p>
							</article>
							<article className="gear-card">
								<h3>No hidden fees</h3>
								<p>
									The price you see is the price you pay. No deposit surprises,
									no cleaning fees, no extra charges for delivery.
								</p>
							</article>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section section-alt" aria-labelledby="pricing-faq-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Common questions</p>
							<h2 className="section-title" id="pricing-faq-heading">
								Pricing FAQ
							</h2>
						</div>
					</Reveal>
					<Reveal>
						<div className="faq-list">
							<details className="faq-item">
								<summary className="faq-question">What&apos;s the minimum rental period?</summary>
								<p className="faq-answer">
									Daily rentals have a 3-day minimum. Weekly rentals run for 7 days.
									For stays longer than 2 weeks, contact us for a custom rate.
								</p>
							</details>
							<details className="faq-item">
								<summary className="faq-question">Can I upgrade my package mid-rental?</summary>
								<p className="faq-answer">
									Yes. If you start with a Board Only and decide you need a wetsuit,
									just let us know and we&apos;ll arrange a swap delivery.
								</p>
							</details>
							<details className="faq-item">
								<summary className="faq-question">Is delivery really free?</summary>
								<p className="faq-answer">
									Yes — delivery and pickup are included in every package at no extra cost.
									We deliver to accommodations in Aljezur, Arrifana, Vale da Telha, and
									Monte Cl&eacute;rigo.
								</p>
							</details>
							<details className="faq-item">
								<summary className="faq-question">Do you offer group discounts?</summary>
								<p className="faq-answer">
									Groups of 3&ndash;5 people save approximately 12% per person. For groups
									of 6 or more, we offer custom quotes. See our{" "}
									<Link href="/group-bookings">group bookings page</Link> for details.
								</p>
							</details>
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection
				heading="Ready to book?"
				text="Pick your dates and we'll have the gear waiting at your door."
			/>
		</>
	);
}

function pricingProductJsonLd() {
	return {
		"@context": "https://schema.org",
		"@type": "Product",
		name: "Surf Gear Rental — Surf Rental Aljezur",
		description:
			"Surfboard and wetsuit rental packages with free delivery to your accommodation in Aljezur, Arrifana, Vale da Telha, Monte Cl\u00E9rigo, Amoreira, and Carrapateira on the Costa Vicentina.",
		brand: {
			"@type": "Brand",
			name: "Surf Rental Aljezur",
		},
		offers: {
			"@type": "AggregateOffer",
			lowPrice: String(prices.boardOnly.daily.amount),
			highPrice: String(prices.fullPackage.extended.amount),
			priceCurrency: "EUR",
			offerCount: "6",
			availability: "https://schema.org/InStock",
			offers: [
				{
					"@type": "Offer",
					name: "Board Only — Daily",
					price: String(prices.boardOnly.daily.amount),
					priceCurrency: "EUR",
					priceSpecification: {
						"@type": "UnitPriceSpecification",
						price: String(prices.boardOnly.daily.amount),
						priceCurrency: "EUR",
						unitCode: "DAY",
						referenceQuantity: {
							"@type": "QuantitativeValue",
							value: "1",
							unitCode: "DAY",
						},
					},
					availability: "https://schema.org/InStock",
					priceValidUntil: PRICE_VALID_UNTIL,
				},
				{
					"@type": "Offer",
					name: "Board Only — Weekly",
					price: String(prices.boardOnly.weekly.amount),
					priceCurrency: "EUR",
					priceSpecification: {
						"@type": "UnitPriceSpecification",
						price: String(prices.boardOnly.weekly.amount),
						priceCurrency: "EUR",
						unitCode: "WEE",
						referenceQuantity: {
							"@type": "QuantitativeValue",
							value: "1",
							unitCode: "WEE",
						},
					},
					availability: "https://schema.org/InStock",
					priceValidUntil: PRICE_VALID_UNTIL,
				},
				{
					"@type": "Offer",
					name: "Full Package (Board + Wetsuit) — Daily",
					price: String(prices.fullPackage.daily.amount),
					priceCurrency: "EUR",
					priceSpecification: {
						"@type": "UnitPriceSpecification",
						price: String(prices.fullPackage.daily.amount),
						priceCurrency: "EUR",
						unitCode: "DAY",
					},
					availability: "https://schema.org/InStock",
					priceValidUntil: PRICE_VALID_UNTIL,
				},
				{
					"@type": "Offer",
					name: "Full Package (Board + Wetsuit) — Weekly",
					price: String(prices.fullPackage.weekly.amount),
					priceCurrency: "EUR",
					priceSpecification: {
						"@type": "UnitPriceSpecification",
						price: String(prices.fullPackage.weekly.amount),
						priceCurrency: "EUR",
						unitCode: "WEE",
					},
					availability: "https://schema.org/InStock",
					priceValidUntil: PRICE_VALID_UNTIL,
				},
				{
					"@type": "Offer",
					name: "Board Only — 2 weeks",
					price: String(prices.boardOnly.extended.amount),
					priceCurrency: "EUR",
					availability: "https://schema.org/InStock",
					priceValidUntil: PRICE_VALID_UNTIL,
				},
				{
					"@type": "Offer",
					name: "Full Package (Board + Wetsuit) — 2 weeks",
					price: String(prices.fullPackage.extended.amount),
					priceCurrency: "EUR",
					availability: "https://schema.org/InStock",
					priceValidUntil: PRICE_VALID_UNTIL,
				},
			],
		},
	};
}
