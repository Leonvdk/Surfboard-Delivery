import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "../components/cta-section";
import { JsonLd } from "../components/json-ld";
import { HorizonLine, Reveal } from "../components/reveal";
import { breadcrumbJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Our Partners — Surf Schools, Stays & Local Businesses in Aljezur",
	description:
		"Meet the local businesses we work with in Aljezur. Surf schools, accommodation, restaurants, and activity providers — our recommended partners on the Costa Vicentina.",
	alternates: { canonical: "/partners" },
	openGraph: {
		title: "Partners | SurfRental Aljezur",
		description:
			"Local surf schools, accommodation, restaurants, and activities we partner with in the Aljezur area.",
		url: `${SITE_URL}/partners`,
	},
};

export default function PartnersPage() {
	return (
		<>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", url: SITE_URL },
					{ name: "Partners", url: `${SITE_URL}/partners` },
				])}
			/>

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>Part of the Aljezur community</h1>
							<p className="page-hero-sub">
								We work with the best local businesses to make your surf trip complete — from
								lessons to lunch, accommodation to adventure.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="schools-heading">
				<div className="container">
					<Reveal>
						<div className="section-header">
							<p className="section-label">Surf schools</p>
							<h2 className="section-title" id="schools-heading">
								Learn from the best
							</h2>
							<p className="section-desc">
								Want lessons alongside your rental? These surf schools operate on the beaches we
								know best.
							</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="partner-grid">
							<article className="partner-card">
								<h3>Arrifana Surf School</h3>
								<span className="partner-type">Surf school</span>
								<p>
									Right on Praia da Arrifana. Daily lessons for beginners and intermediates, run by
									experienced local instructors. Kids&apos; lessons available.
								</p>
								<a href="https://arrifanasurfschool.com" target="_blank" rel="noopener noreferrer">
									arrifanasurfschool.com
								</a>
							</article>
							<article className="partner-card">
								<h3>Aljezur Surf School</h3>
								<span className="partner-type">Surf school</span>
								<p>
									Operating across multiple beaches depending on conditions. ISA-certified
									instructors with a focus on safety and progression.
								</p>
								<a href="https://aljezursurfschool.com" target="_blank" rel="noopener noreferrer">
									aljezursurfschool.com
								</a>
							</article>
							<article className="partner-card">
								<h3>Costa Vicentina Surf</h3>
								<span className="partner-type">Surf school &amp; guiding</span>
								<p>
									Lessons plus guided surf sessions for intermediates who want to explore new spots
									with a local who knows the conditions.
								</p>
								<a href="https://costavicentinasurfschool.com" target="_blank" rel="noopener noreferrer">
									costavicentinasurfschool.com
								</a>
							</article>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section section-alt" aria-labelledby="stays-heading">
				<div className="container">
					<Reveal>
						<div className="section-header">
							<p className="section-label">Accommodation</p>
							<h2 className="section-title" id="stays-heading">
								Where to stay
							</h2>
							<p className="section-desc">
								We deliver to all of these regularly. They know us, we know them — it&apos;s a
								smooth experience for everyone.
							</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="partner-grid">
							<article className="partner-card">
								<h3>Vicentina Hotel</h3>
								<span className="partner-type">Hotel &amp; apartments</span>
								<p>
									Modern apartments in Aljezur town with pool and garden. Walking distance to
									restaurants and the Saturday market.
								</p>
							</article>
							<article className="partner-card">
								<h3>Vale da Telha Villas</h3>
								<span className="partner-type">Holiday villas</span>
								<p>
									Self-catering villas in the quiet Vale da Telha urbanisation. Close to Arrifana
									and perfect for families or groups.
								</p>
							</article>
							<article className="partner-card">
								<h3>Monte Clérigo Guesthouses</h3>
								<span className="partner-type">Guesthouse</span>
								<p>
									Charming village guesthouses steps from Monte Clérigo beach. Simple, clean, and
									right on the doorstep of the surf.
								</p>
							</article>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="food-heading">
				<div className="container">
					<Reveal>
						<div className="section-header">
							<p className="section-label">Restaurants &amp; cafés</p>
							<h2 className="section-title" id="food-heading">
								Post-surf fuel
							</h2>
							<p className="section-desc">
								Where we eat after a session. These are places we genuinely recommend, not paid
								placements.
							</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="partner-grid">
							<article className="partner-card">
								<h3>Pont&apos;a Pé</h3>
								<span className="partner-type">Restaurant</span>
								<p>
									Fresh fish and traditional Algarvian dishes in the heart of Aljezur. The cataplana
									is outstanding.
								</p>
							</article>
							<article className="partner-card">
								<h3>Mira da Serra</h3>
								<span className="partner-type">Café &amp; brunch</span>
								<p>
									Great coffee, homemade cakes, and proper breakfast. The terrace has views over the
									Aljezur valley.
								</p>
							</article>
							<article className="partner-card">
								<h3>Casa da Praia</h3>
								<span className="partner-type">Beach bar &amp; restaurant</span>
								<p>
									Right above Arrifana beach. Cold beer, fresh salads, and grilled fish with the
									sound of waves below.
								</p>
							</article>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section section-alt" aria-labelledby="activities-heading">
				<div className="container">
					<Reveal>
						<div className="section-header">
							<p className="section-label">Activities</p>
							<h2 className="section-title" id="activities-heading">
								Beyond the surf
							</h2>
							<p className="section-desc">
								Flat day? Rest day? There&apos;s plenty to do on the Costa Vicentina.
							</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="partner-grid">
							<article className="partner-card">
								<h3>Rota Vicentina</h3>
								<span className="partner-type">Hiking</span>
								<p>
									The Fisherman&apos;s Trail and Historical Way pass right through Aljezur.
									Stunning clifftop walks and multi-day trails.
								</p>
								<a href="https://rotavicentina.com" target="_blank" rel="noopener noreferrer">
									rotavicentina.com
								</a>
							</article>
							<article className="partner-card">
								<h3>Yoga with Maria</h3>
								<span className="partner-type">Yoga &amp; wellness</span>
								<p>
									Drop-in yoga classes in Vale da Telha. Perfect for pre-surf stretching or a
									rest-day reset. All levels welcome.
								</p>
							</article>
							<article className="partner-card">
								<h3>Aljezur SUP</h3>
								<span className="partner-type">Stand-up paddleboard</span>
								<p>
									SUP tours on the calm Aljezur river estuary. A completely different perspective
									on the area — and great for flat days.
								</p>
							</article>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="become-heading">
				<div className="container">
					<Reveal>
						<div className="content-prose" style={{ textAlign: "center" as const }}>
							<h2 className="section-title" id="become-heading">
								Want to partner with us?
							</h2>
							<p>
								If you run a business in the Aljezur area and want to work together — whether
								that&apos;s cross-referrals, accommodation partnerships, or something else — we&apos;d
								love to hear from you.
							</p>
							<Link href="/contact?subject=Partnership+Enquiry" className="btn btn-primary">
								Get in touch
							</Link>
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection />
		</>
	);
}
