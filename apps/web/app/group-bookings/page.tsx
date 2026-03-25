import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "../components/cta-section";
import { JsonLd } from "../components/json-ld";
import { HorizonLine, Reveal } from "../components/reveal";
import { breadcrumbJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";
import { getGroupPrice } from "../lib/pricing";

export const metadata: Metadata = {
	title: "Group Surf Gear Rental Aljezur — Families, Friends & Retreats",
	description:
		"Rent surf gear for groups of 3 or more in Aljezur. Discounted rates for families, friend groups, surf camps, and corporate retreats. Delivered to your accommodation.",
	alternates: { canonical: "/group-bookings" },
	openGraph: {
		title: "Group Bookings | SurfRental Aljezur",
		description:
			"Discounted surf gear rental for groups. Boards and wetsuits for families, friends, and retreats delivered in Aljezur.",
		url: `${SITE_URL}/group-bookings`,
	},
};

export default function GroupBookingsPage() {
	return (
		<>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", url: SITE_URL },
					{ name: "Group Bookings", url: `${SITE_URL}/group-bookings` },
				])}
			/>

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>Gear for the whole crew</h1>
							<p className="page-hero-sub">
								Whether it&apos;s family, friends, or a full retreat — we deliver the right mix of
								boards and wetsuits for every level in the group.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="who-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Who we serve</p>
							<h2 className="section-title" id="who-heading">
								Groups of every kind
							</h2>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="grid-4">
							<article className="feature-card">
								<div className="feature-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
										<circle cx="9" cy="7" r="4" />
										<path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
									</svg>
								</div>
								<h3>Families</h3>
								<p>
									Mix of adult and kids boards, wetsuits sized for everyone. One delivery, whole
									family sorted.
								</p>
							</article>
							<article className="feature-card">
								<div className="feature-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
									</svg>
								</div>
								<h3>Friend groups</h3>
								<p>
									Different levels, different boards. We curate the right quiver so everyone has
									the perfect ride.
								</p>
							</article>
							<article className="feature-card">
								<div className="feature-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<rect x="2" y="7" width="20" height="14" rx="2" />
										<path d="M16 7V5a4 4 0 00-8 0v2" />
									</svg>
								</div>
								<h3>Surf camps &amp; schools</h3>
								<p>
									Bulk boards for instruction. We work with local surf schools to keep the quiver
									stocked.
								</p>
							</article>
							<article className="feature-card">
								<div className="feature-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<rect x="2" y="3" width="20" height="18" rx="2" />
										<path d="M8 7h8M8 11h8M8 15h4" />
									</svg>
								</div>
								<h3>Corporate retreats</h3>
								<p>
									Team building in the Atlantic. We handle all the gear logistics while you focus
									on the experience.
								</p>
							</article>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section section-alt" aria-labelledby="how-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">How it works</p>
							<h2 className="section-title" id="how-heading">
								Booking for groups
							</h2>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="steps-grid">
							<div className="step">
								<div className="step-number">01</div>
								<div>
									<h3 className="step-title">Tell us about your group</h3>
									<p className="step-desc">
										How many people, their experience levels, and your dates. We&apos;ll recommend the
										right boards and wetsuits for everyone.
									</p>
								</div>
							</div>
							<div className="step">
								<div className="step-number">02</div>
								<div>
									<h3 className="step-title">We curate the quiver</h3>
									<p className="step-desc">
										Foamies for beginners, funboards for intermediates, performance boards for the
										experienced. Every board matched to a surfer.
									</p>
								</div>
							</div>
							<div className="step">
								<div className="step-number">03</div>
								<div>
									<h3 className="step-title">One delivery, everyone sorted</h3>
									<p className="step-desc">
										All gear arrives together at your accommodation. We walk the group through
										everything and share spot recommendations.
									</p>
								</div>
							</div>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="pricing-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Group pricing</p>
							<h2 className="section-title" id="pricing-heading">
								More boards, better rates
							</h2>
							<p className="section-desc">
								All prices are per person, per week. Delivery and pickup included.
							</p>
						</div>
					</Reveal>
					<Reveal>
						<table className="group-pricing-table">
							<thead>
								<tr>
									<th>Group size</th>
									<th>Board only</th>
									<th>Full package</th>
									<th>Premium</th>
									<th>Saving</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>1–2 people</td>
									<td>&euro;{getGroupPrice("boardOnly", "small")} / person</td>
									<td>&euro;{getGroupPrice("fullPackage", "small")} / person</td>
									<td>&euro;{getGroupPrice("premium", "small")} / person</td>
									<td>—</td>
								</tr>
								<tr>
									<td>3–5 people</td>
									<td>&euro;{getGroupPrice("boardOnly", "medium")} / person</td>
									<td>&euro;{getGroupPrice("fullPackage", "medium")} / person</td>
									<td>&euro;{getGroupPrice("premium", "medium")} / person</td>
									<td className="price-highlight">~12% off</td>
								</tr>
								<tr>
									<td>6+ people</td>
									<td colSpan={4}>Custom quote — <Link href="/contact" style={{ color: "var(--gold)", textDecoration: "underline" }}>get in touch</Link></td>
								</tr>
							</tbody>
						</table>
					</Reveal>
					<Reveal>
						<div className="content-prose" style={{ textAlign: "center" as const, marginTop: "var(--space-5)" }}>
							<p>
								All prices are per person, per week. Mix and match packages within
								a group — we&apos;ll work it out. Premium includes board, wetsuit,
								changing tub &amp; roof rack pads.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section section-alt" aria-labelledby="faq-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Common questions</p>
							<h2 className="section-title" id="faq-heading">
								Group booking FAQ
							</h2>
						</div>
					</Reveal>
					<Reveal>
						<div className="faq-list">
							<details className="faq-item">
								<summary className="faq-question">What&apos;s the maximum group size?</summary>
								<p className="faq-answer">
									We&apos;ve delivered to groups of 12. For larger groups (surf camps, corporate
									events), get in touch and we&apos;ll make it happen — we may just need extra
									lead time.
								</p>
							</details>
							<details className="faq-item">
								<summary className="faq-question">
									Can we have different board types within one group?
								</summary>
								<p className="faq-answer">
									Absolutely. That&apos;s the whole point. Tell us each person&apos;s level and
									we&apos;ll match them with the right board — from soft-tops to shortboards.
								</p>
							</details>
							<details className="faq-item">
								<summary className="faq-question">How far in advance should we book?</summary>
								<p className="faq-answer">
									For groups of 6+, we recommend booking at least 2 weeks ahead, especially during
									summer (June–September). Smaller groups can often book with a few days&apos; notice.
								</p>
							</details>
							<details className="faq-item">
								<summary className="faq-question">Can we swap boards mid-stay?</summary>
								<p className="faq-answer">
									Yes. If someone outgrows their board or wants to try something different, we&apos;ll
									swap it out. Extended Stay groups get unlimited swaps included.
								</p>
							</details>
						</div>
					</Reveal>
					<Reveal>
						<div className="section-footer">
							<Link href="/faq" className="btn btn-secondary">
								View all FAQs
							</Link>
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection />
		</>
	);
}
