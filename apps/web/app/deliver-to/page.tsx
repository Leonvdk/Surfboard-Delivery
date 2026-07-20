import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "../components/cta-section";
import { HorizonLine, Reveal } from "../components/reveal";
import { DELIVERY_TOWNS } from "../lib/delivery-towns";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Delivery Zones — Where We Deliver Surf Gear",
	description:
		"Free surfboard and wetsuit delivery across the Costa Vicentina: Aljezur, Arrifana, Vale da Telha, Monte Clérigo, and Carrapateira. From €18/day board-only, €28/day with wetsuit. Three-day minimum.",
	alternates: { canonical: "/deliver-to" },
	openGraph: {
		title: "Delivery Zones | Surf Rental Aljezur",
		description:
			"Free delivery to Aljezur, Arrifana, Vale da Telha, Monte Clérigo, and Carrapateira. From €18/day.",
		url: `${SITE_URL}/deliver-to`,
	},
};

export default function DeliverToIndexPage() {
	return (
		<>
			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>Where we deliver surfboards on the Costa Vicentina</h1>
							<p className="page-hero-sub">
								Free delivery and pickup to five service areas across the western
								Algarve — from €18/day board-only, €28/day with wetsuit,
								three-day minimum. Pick your stay location for delivery details
								and the boards our guests there usually take.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="towns-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Delivery zones</p>
							<h2 className="section-title" id="towns-heading">
								Five towns · one flat delivery promise
							</h2>
							<p className="section-desc">
								Every town below has free delivery and free pickup on every
								rental — no minimum order, no distance surcharge.
							</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="boards-grid">
							{DELIVERY_TOWNS.map((town) => (
								<Link
									key={town.slug}
									href={`/deliver-to/${town.slug}`}
									className="board-card-link"
								>
									<article className="board-card">
										<div className="board-card-body">
											<h3 className="board-card-title">{town.name}</h3>
											<p className="board-card-desc">{town.oneLiner}</p>
										</div>
									</article>
								</Link>
							))}
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection
				heading="Not sure which zone you're in?"
				text="Send us your accommodation address and we'll confirm within 24 hours."
				buttonText="Ask us"
			/>
		</>
	);
}
