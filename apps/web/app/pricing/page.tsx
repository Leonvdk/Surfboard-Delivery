import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../components/breadcrumbs";
import { CtaSection } from "../components/cta-section";
import { JsonLd } from "../components/json-ld";
import { PricingToggle } from "../components/pricing-toggle";
import { HorizonLine, Reveal } from "../components/reveal";
import { breadcrumbJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";
import { prices } from "../lib/pricing";

export const metadata: Metadata = {
	title: "Pricing — Daily & Weekly Surf Rental Packages",
	description:
		"Surfboard and wetsuit rental from \u20AC25/day or \u20AC85/week. Board only, full package, or premium bundle with changing mat & roof rack — free delivery in Aljezur, Arrifana, and Vale da Telha.",
	alternates: { canonical: "/pricing" },
	openGraph: {
		title: "Pricing — Daily & Weekly Surf Rental Packages | SurfRental Aljezur",
		description:
			"Surfboard and wetsuit rental packages from \u20AC25/day or \u20AC85/week with free delivery on the Costa Vicentina.",
		url: `${SITE_URL}/pricing`,
	},
};

export default function PricingPage() {
	return (
		<>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", url: SITE_URL },
					{ name: "Pricing", url: `${SITE_URL}/pricing` },
				])}
			/>
			<JsonLd data={pricingProductJsonLd()} />

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Pricing" }]} />
						<div>
							<h1>Simple, transparent pricing</h1>
							<p className="page-hero-sub">
								Daily or weekly — pick the duration that fits your trip. Every rental
								includes free delivery and pickup to your accommodation. Not sure which
								gear to pick? Check our{" "}
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
								Book for two weeks and save even more. Includes a mid-stay board swap.
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
							<div className="extended-price-item">
								<span className="extended-label">Premium Package</span>
								<span className="extended-amount">&euro;{prices.premium.extended.amount}</span>
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
								<summary className="faq-question">What&apos;s included in the Premium Package?</summary>
								<p className="faq-answer">
									The Premium Package includes a surfboard, season-appropriate wetsuit,
									leash &amp; wax, a changing mat for getting changed at the beach, and
									roof rack pads so you can transport the board on your rental car.
								</p>
							</details>
							<details className="faq-item">
								<summary className="faq-question">Can I upgrade my package mid-rental?</summary>
								<p className="faq-answer">
									Yes. If you start with a Board Only and decide you need a wetsuit, or want
									to add the changing mat and roof rack, just let us know and we&apos;ll
									arrange a swap delivery.
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
		name: "Surf Gear Rental — SurfRental Aljezur",
		description:
			"Surfboard and wetsuit rental packages with free delivery to your accommodation in Aljezur, Arrifana, Vale da Telha, and Monte Cl\u00E9rigo.",
		brand: {
			"@type": "Brand",
			name: "SurfRental Aljezur",
		},
		offers: {
			"@type": "AggregateOffer",
			lowPrice: String(prices.boardOnly.daily.amount),
			highPrice: String(prices.premium.weekly.amount),
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
					priceValidUntil: "2026-12-31",
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
					priceValidUntil: "2026-12-31",
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
					priceValidUntil: "2026-12-31",
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
					priceValidUntil: "2026-12-31",
				},
				{
					"@type": "Offer",
					name: "Premium Package (Board + Wetsuit + Changing Mat + Roof Rack) — Daily",
					price: String(prices.premium.daily.amount),
					priceCurrency: "EUR",
					priceSpecification: {
						"@type": "UnitPriceSpecification",
						price: String(prices.premium.daily.amount),
						priceCurrency: "EUR",
						unitCode: "DAY",
					},
					availability: "https://schema.org/InStock",
					priceValidUntil: "2026-12-31",
				},
				{
					"@type": "Offer",
					name: "Premium Package (Board + Wetsuit + Changing Mat + Roof Rack) — Weekly",
					price: String(prices.premium.weekly.amount),
					priceCurrency: "EUR",
					priceSpecification: {
						"@type": "UnitPriceSpecification",
						price: String(prices.premium.weekly.amount),
						priceCurrency: "EUR",
						unitCode: "WEE",
					},
					availability: "https://schema.org/InStock",
					priceValidUntil: "2026-12-31",
				},
			],
		},
	};
}
