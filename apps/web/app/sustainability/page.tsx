import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "../components/cta-section";
import { HorizonLine, Reveal } from "../components/reveal";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Sustainability — How Surf Rental Protects the Costa Vicentina",
	description:
		"Our commitment to protecting the Costa Vicentina Natural Park. Learn about our eco-friendly practices, beach cleanups, and how you can help as a visitor.",
	alternates: { canonical: "/sustainability" },
	openGraph: {
		title: "Sustainability | Surf Rental Aljezur",
		description:
			"We surf here. We protect here. Our commitment to low-impact operations on the Costa Vicentina.",
		url: `${SITE_URL}/sustainability`,
	},
};

export default function SustainabilityPage() {
	return (
		<>
			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>We surf here. We protect here.</h1>
							<p className="page-hero-sub">
								The Costa Vicentina is one of Europe&apos;s last wild coastlines. We&apos;re
								committed to keeping it that way.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="practices-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Our practices</p>
							<h2 className="section-title" id="practices-heading">
								How we reduce our impact
							</h2>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="eco-grid">
							<article className="eco-card">
								<h3>Repair before replace</h3>
								<p>
									Dings, cracks, and wear are part of surfing. We repair our boards and patch our
									wetsuits rather than sending them to landfill. A well-maintained board has years
									of life left.
								</p>
							</article>
							<article className="eco-card">
								<h3>Eco-friendly wax</h3>
								<p>
									We use natural, biodegradable surf wax free from petrochemicals. It grips just as
									well and doesn&apos;t leave toxins in the water or on the sand.
								</p>
							</article>
							<article className="eco-card">
								<h3>Beach cleanups</h3>
								<p>
									We participate in regular community beach cleanups along the Costa Vicentina. We
									also pick up rubbish every time we visit a beach — it&apos;s just part of the routine.
								</p>
							</article>
							<article className="eco-card">
								<h3>Minimal packaging</h3>
								<p>
									No single-use plastic in our operation. Gear is delivered by hand, not shipped in
									packaging. Board bags are reused indefinitely.
								</p>
							</article>
							<article className="eco-card">
								<h3>Local sourcing</h3>
								<p>
									We buy from Portuguese shapers and European wetsuit makers wherever possible,
									reducing shipping distances and supporting local craft.
								</p>
							</article>
							<article className="eco-card">
								<h3>Efficient delivery routes</h3>
								<p>
									We group deliveries by area and schedule pickups on natural routes to minimise
									driving. Our delivery area is compact by design — not sprawling.
								</p>
							</article>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section section-alt" aria-labelledby="park-heading">
				<div className="container">
					<Reveal>
						<div className="section-header">
							<p className="section-label">Our home</p>
							<h2 className="section-title" id="park-heading">
								The Costa Vicentina Natural Park
							</h2>
						</div>
					</Reveal>
					<Reveal>
						<div className="about-story">
							<p>
								The Southwest Alentejo and Vicentine Coast Natural Park stretches over 100 kilometres
								of Atlantic coastline — from São Torpes in the north to Burgau in the south. It&apos;s
								home to more than 750 plant species, including over 100 that are rare or endemic.
							</p>
							<p>
								White storks nest on the sea cliffs here — one of the only places in the world
								they do so. Peregrine falcons, Bonelli&apos;s eagles, and otters share this
								corridor. In the waters, dolphins are regular visitors and the reefs shelter
								diverse marine life.
							</p>
							<p>
								This coastline has resisted the development pressures that transformed much of the
								Algarve precisely because it&apos;s a protected area. Development is restricted,
								light pollution is minimal, and the landscape looks much as it did centuries ago.
							</p>
							<p>
								Every surfer, hiker, and visitor who respects this place helps ensure it stays
								wild for the next generation.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="tips-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">For visitors</p>
							<h2 className="section-title" id="tips-heading">
								What you can do
							</h2>
							<p className="section-desc">
								Small actions make a real difference in a protected natural park.
							</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="grid-3">
							<article className="feature-card">
								<div className="feature-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z" />
										<path d="M8 12l3 3 5-6" />
									</svg>
								</div>
								<h3>Use reef-safe sunscreen</h3>
								<p>
									Avoid sunscreens with oxybenzone and octinoxate. Mineral-based zinc oxide
									sunscreens protect you and the marine environment.
								</p>
							</article>
							<article className="feature-card">
								<div className="feature-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
										<path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
									</svg>
								</div>
								<h3>Leave no trace</h3>
								<p>
									Take all rubbish with you — including cigarette butts. If you see litter on the
									beach, pick it up. The coast thanks you.
								</p>
							</article>
							<article className="feature-card">
								<div className="feature-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
										<circle cx="12" cy="9" r="2.5" />
									</svg>
								</div>
								<h3>Stay on paths</h3>
								<p>
									Clifftop soil is fragile and erosion is real. Use designated paths and respect
									nesting areas — especially between March and July.
								</p>
							</article>
						</div>
					</Reveal>
					<Reveal>
						<div className="content-prose" style={{ textAlign: "center" as const, marginTop: "var(--space-5)" }}>
							<p>
								Want to learn more about conservation on the Costa Vicentina? Visit the{" "}
								<a
									href="https://rotavicentina.com"
									target="_blank"
									rel="noopener noreferrer"
								>
									Rota Vicentina
								</a>{" "}
								website or ask us for local volunteer opportunities.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection />
		</>
	);
}
