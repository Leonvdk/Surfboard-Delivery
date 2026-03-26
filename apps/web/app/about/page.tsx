import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "../components/cta-section";
import { JsonLd } from "../components/json-ld";
import { HorizonLine, Reveal } from "../components/reveal";
import { organizationJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "About SurfRental Aljezur — Local Surf Gear Delivery",
	description:
		"Meet the team behind SurfRental. Two surfers, one van, and a simple idea: deliver quality surfboards and wetsuits to your door in Aljezur, Arrifana, and Vale da Telha.",
	alternates: { canonical: "/about" },
	openGraph: {
		title: "About SurfRental Aljezur",
		description:
			"Two surfers, one van, zero queues. Learn our story and why we built a surf rental delivery service on the Costa Vicentina.",
		url: `${SITE_URL}/about`,
	},
};

export default function AboutPage() {
	return (
		<>
			<JsonLd data={organizationJsonLd()} />

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>Two surfers, one van, zero queues</h1>
							<p className="page-hero-sub">
								We started SurfRental because we believed renting surf gear should be as easy as
								showing up to the beach.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="story-heading">
				<div className="container">
					<Reveal>
						<div className="section-header">
							<p className="section-label">Our story</p>
							<h2 className="section-title" id="story-heading">
								How it started
							</h2>
						</div>
					</Reveal>
					<Reveal>
						<div className="about-story">
							<p>
								We moved to Aljezur for the same reason most people visit: the waves, the light, the
								pace of life. But after years of watching holiday surfers wrestle boards onto car roofs,
								queue at busy rental shops, and waste precious holiday time on logistics — we figured
								there had to be a better way.
							</p>
							<p>
								SurfRental started with a simple idea. What if we brought quality boards and wetsuits
								directly to people&apos;s accommodation? No queues, no car racks, no deposits. Just
								gear waiting at your door when you arrive, and us picking it up when you leave.
							</p>
							<p>
								We hand-pick every board in our quiver and maintain our wetsuits obsessively. When we
								deliver, we don&apos;t just drop and run — we share what we know. Which beach is
								working, where to paddle out, where to eat afterwards. The kind of knowledge you only
								get from surfing here every day.
							</p>
							<p>
								That&apos;s what SurfRental is: a small, local operation run by surfers who care about
								your holiday as much as you do.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section section-alt" aria-labelledby="beliefs-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">What we believe</p>
							<h2 className="section-title" id="beliefs-heading">
								Three principles
							</h2>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="grid-3">
							<article className="feature-card">
								<div className="feature-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<circle cx="12" cy="12" r="10" />
										<path d="M8 12l3 3 5-6" />
									</svg>
								</div>
								<h3>Simplicity first</h3>
								<p>
									One message to book. Gear at your door. Pickup before checkout. We remove every
									unnecessary step so your holiday stays simple.
								</p>
							</article>
							<article className="feature-card">
								<div className="feature-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
										<circle cx="12" cy="9" r="2.5" />
									</svg>
								</div>
								<h3>Local knowledge</h3>
								<p>
									We surf these beaches every day. When we deliver your gear, we share the kind of
									tips that only locals know — the right spot for the tide, the wind, your level.
								</p>
							</article>
							<article className="feature-card">
								<div className="feature-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z" />
										<path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />
									</svg>
								</div>
								<h3>Respect the coast</h3>
								<p>
									Costa Vicentina is a protected natural park. We run a low-impact operation, repair
									before replacing, and participate in regular beach cleanups.
								</p>
							</article>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="why-heading">
				<div className="container">
					<Reveal>
						<div className="section-header">
							<p className="section-label">Our home</p>
							<h2 className="section-title" id="why-heading">
								Why Aljezur
							</h2>
						</div>
					</Reveal>
					<Reveal>
						<div className="about-story">
							<p>
								Aljezur sits on Portugal&apos;s wild west coast, inside the Southwest Alentejo and
								Vicentine Coast Natural Park. It&apos;s one of the last stretches of truly undeveloped
								European coastline — dramatic cliffs, empty beaches, and consistent waves all year
								round.
							</p>
							<p>
								Unlike the crowded lineups further north, the beaches around Aljezur stay remarkably
								uncrowded. Arrifana offers a sheltered bay for all levels. Monte Clérigo has gentle
								reform waves perfect for learning. Amoreira&apos;s river mouth creates powerful,
								varied surf. And Vale Figueiras rewards the adventurous with raw, empty power.
							</p>
							<p>
								Off the water, Aljezur is a quiet market town with a Moorish castle on the hill,
								excellent restaurants, and a laid-back community of surfers, artists, and families who
								chose this place for the same reasons you&apos;re considering it.
							</p>
							<p>
								We wouldn&apos;t want to be anywhere else — and we think you&apos;ll understand why
								when you get here.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section section-alt" aria-labelledby="gear-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">The gear</p>
							<h2 className="section-title" id="gear-heading">
								Quality you can trust
							</h2>
							<p className="section-desc">
								We ride the same boards we rent out. Our quiver covers every level — from forgiving
								foamies for first-timers to performance shortboards for experienced surfers.
							</p>
						</div>
					</Reveal>
					<Reveal>
						<div className="section-footer">
							<Link href="/surf-gear" className="btn btn-secondary">
								See our full gear range
							</Link>
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection />
		</>
	);
}
