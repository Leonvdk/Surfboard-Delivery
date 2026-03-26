import type { Metadata } from "next";
import { Breadcrumbs } from "../components/breadcrumbs";
import { CtaSection } from "../components/cta-section";
import { JsonLd } from "../components/json-ld";
import { HorizonLine, Reveal } from "../components/reveal";
import { breadcrumbJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Surf Spots Guide — Arrifana, Monte Clérigo, Amoreira & More",
	description:
		"Complete guide to the best surf spots near Aljezur on the Costa Vicentina. Wave conditions, best tides, difficulty levels, and seasonal tips for Arrifana, Monte Clérigo, Amoreira, and Vale Figueiras.",
	alternates: { canonical: "/surf-spots" },
	openGraph: {
		title: "Surf Spots Guide — Aljezur & Costa Vicentina | SurfRental",
		description:
			"Everything you need to know about surfing Arrifana, Monte Clérigo, Amoreira, and the best breaks on Portugal's Costa Vicentina.",
		url: `${SITE_URL}/surf-spots`,
	},
};

const spots = [
	{
		name: "Praia da Arrifana",
		level: "All levels",
		description:
			"The most popular surf beach in the Aljezur area. Arrifana sits in a wide, sheltered bay that catches west and northwest swells while offering protection from north winds. The main beach break offers multiple shifting peaks across a wide sandy stretch — plenty of space to spread out.",
		bestFor:
			"Beginners stick to the middle section where waves reform gently. Intermediate surfers head to the outside peaks for longer rides. When a solid swell wraps into the bay, the right-hand point break at the north end (Canal / Kangaroos) fires for advanced surfers.",
		bestTide: "Works on all tides. Low tide tends to be steeper, high tide more forgiving.",
		bestSeason:
			"Year-round. Summer (Jun–Sep) brings smaller, mellow waves ideal for learning. Shoulder season (Apr–May, Oct) balances clean conditions with manageable swell. Winter (Nov–Mar) delivers powerful swells for experienced surfers.",
		access:
			"10-minute drive from Aljezur, 5 minutes from Vale da Telha. Parking at the top of the cliff with a short walk down.",
	},
	{
		name: "Monte Clérigo",
		level: "Beginner – Intermediate",
		description:
			"A beautiful beach nestled between dramatic cliffs, just north of Aljezur. Monte Clérigo offers a reliable beach break with forgiving, crumbly waves that are ideal for improving your surfing. The beach faces west-northwest and picks up plenty of swell.",
		bestFor:
			"Beginners and intermediate surfers. The waves break over sand and are more forgiving than Arrifana on bigger days. Good for building confidence and working on turns.",
		bestTide: "Best around mid to high tide. Low tide can be shallow and close-out.",
		bestSeason:
			"Best in summer and shoulder seasons when the swell is manageable. Can get powerful in winter — check conditions before paddling out.",
		access:
			"15-minute drive from Aljezur. Small village with cafés and a restaurant overlooking the beach.",
	},
	{
		name: "Amoreira",
		level: "Intermediate – Advanced",
		description:
			"A dramatic river-mouth beach break where the Aljezur river meets the Atlantic. The sandbanks here shift with the river flow, creating powerful, hollow waves that reward experienced surfers. The cliffs and dunes surrounding the beach make it feel wild and remote.",
		bestFor:
			"Intermediate to advanced surfers. The waves pack more punch than Arrifana and Monte Clérigo. Strong currents near the river mouth require experience.",
		bestTide:
			"Best from mid to high tide. Avoid low tide when the waves close out on shallow banks.",
		bestSeason:
			"Works year-round but really comes alive in autumn and winter with consistent northwest swells. Summer can be flat or very small.",
		access:
			"20-minute drive from Aljezur. Boardwalk through the dunes to the beach. Limited parking.",
	},
	{
		name: "Vale Figueiras",
		level: "Intermediate – Advanced",
		description:
			"An exposed, wide-open beach break about 30 minutes south of Aljezur. Vale Figueiras faces due west and catches every bit of swell the Atlantic sends. It's less visited than Arrifana, which means fewer crowds and more waves for you.",
		bestFor:
			"Intermediate and advanced surfers looking for uncrowded peaks. Multiple sandbars create options across a long stretch of beach.",
		bestTide: "Works on all tides. Low tide can produce some nice barrels on the right sandbars.",
		bestSeason:
			"Consistent year-round. One of the most reliable spots in the area thanks to its exposure. Good option when Arrifana is too small.",
		access:
			"30 minutes south from Aljezur via a quiet country road. Dirt track parking above the beach.",
	},
	{
		name: "Canal / Kangaroos (Arrifana Point)",
		level: "Advanced",
		description:
			"A right-hand point break at the northern end of Arrifana bay. When a solid west or northwest swell wraps around the headland, Canal produces fast, hollow waves breaking over rocky reef. It's a fickle spot — it needs the right swell direction and size to work.",
		bestFor:
			"Experienced surfers only. Sharp rocks, strong currents, and a heavy wave demand confidence and skill. When it's on, it's one of the best waves in the Algarve.",
		bestTide: "Works best from mid to high tide. Low tide exposes too much rock.",
		bestSeason:
			"Autumn and winter when Atlantic storms send large west-northwest swells. Rarely works in summer.",
		access:
			"Walk north along the rocks from Arrifana beach. Only accessible at lower tides. Check conditions from the cliff before committing.",
	},
];

export default function SurfSpotsPage() {
	return (
		<>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", url: SITE_URL },
					{ name: "Surf Spots Guide", url: `${SITE_URL}/surf-spots` },
				])}
			/>

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Surf Spots" }]} />
						<div>
							<h1>Surf spots near Aljezur</h1>
							<p className="page-hero-sub">
								The Costa Vicentina is one of Europe&apos;s best-kept surf secrets — year-round
								waves, uncrowded lineups, and stunning scenery.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="overview-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Overview</p>
							<h2 className="section-title" id="overview-heading">
								The coast at a glance
							</h2>
							<p className="section-desc">
								All spots are within 15–30 minutes of Aljezur. The best spot on any given day
								depends on swell direction, size, and wind — we include local tips with every
								rental.
							</p>
						</div>
					</Reveal>

					<Reveal>
						<div className="content-prose">
							<h3>When to surf</h3>
							<p>
								<strong>Summer (June – September):</strong> The water warms to 18–20°C and the
								waves mellow out. Perfect for beginners and families. Expect smaller, clean swells
								with light offshore winds in the morning.
							</p>
							<p>
								<strong>Shoulder season (April – May, October):</strong> The sweet spot. Moderate
								swells, fewer crowds, and pleasant weather. Suitable for all levels.
							</p>
							<p>
								<strong>Winter (November – March):</strong> Powerful North Atlantic swells deliver
								serious waves. This is the season for experienced surfers chasing hollow, overhead
								waves. Not recommended for beginners.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			{spots.map((spot, index) => (
				<section
					key={spot.name}
					className={`section ${index % 2 === 1 ? "section-alt" : ""}`}
					aria-labelledby={`spot-${spot.name.toLowerCase().replace(/[^a-z]/g, "-")}`}
				>
					<div className="container">
						<Reveal>
							<div className="spot-detail">
								<div className="spot-detail-header">
									<span className="spot-level">{spot.level}</span>
									<h2
										className="section-title"
										id={`spot-${spot.name.toLowerCase().replace(/[^a-z]/g, "-")}`}
									>
										{spot.name}
									</h2>
								</div>
								<p className="spot-detail-desc">{spot.description}</p>
							</div>
						</Reveal>
						<Reveal stagger>
							<dl className="spot-detail-grid">
								<div className="spot-detail-item">
									<dt>Best for</dt>
									<dd>{spot.bestFor}</dd>
								</div>
								<div className="spot-detail-item">
									<dt>Tide</dt>
									<dd>{spot.bestTide}</dd>
								</div>
								<div className="spot-detail-item">
									<dt>Season</dt>
									<dd>{spot.bestSeason}</dd>
								</div>
								<div className="spot-detail-item">
									<dt>Getting there</dt>
									<dd>{spot.access}</dd>
								</div>
							</dl>
						</Reveal>
					</div>
				</section>
			))}

			<HorizonLine />

			<section className="section" aria-labelledby="tips-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Safety &amp; etiquette</p>
							<h2 className="section-title" id="tips-heading">
								Before you paddle out
							</h2>
						</div>
					</Reveal>
					<Reveal>
						<div className="content-prose">
							<ul>
								<li>
									<strong>Check conditions before you go.</strong> Observe from the cliff for 10
									minutes before paddling out.
								</li>
								<li>
									<strong>Respect the lineup.</strong> Don&apos;t drop in on other surfers. The
									person closest to the peak has priority.
								</li>
								<li>
									<strong>Know your limits.</strong> If it looks too big or too powerful, it probably
									is.
								</li>
								<li>
									<strong>Protect the coast.</strong> The Costa Vicentina is a natural park. Leave
									no trace.
								</li>
								<li>
									<strong>Wear sun protection.</strong> Even on cloudy days, the Portuguese sun is
									strong. Use reef-safe sunscreen.
								</li>
							</ul>
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection
				heading="Gear sorted, waves waiting"
				text="We deliver surfboards and wetsuits to your door so you can focus on the surf."
				buttonText="Reserve your gear"
			/>
		</>
	);
}
