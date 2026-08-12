import type { Metadata } from "next";
import { CtaSection } from "../components/cta-section";
import { JsonLd } from "../components/json-ld";
import { HorizonLine, Reveal } from "../components/reveal";
import { breadcrumbJsonLd, faqJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Aljezur Surf Spots Guide — Arrifana, Amoreira & More",
	description:
		"Complete guide to the best surf spots near Aljezur on the Costa Vicentina. Wave conditions, best tides, difficulty levels, and seasonal tips for Arrifana, Monte Clérigo, Amoreira, and Vale Figueiras.",
	alternates: { canonical: "/surf-spots" },
	openGraph: {
		title: "Surf Spots Guide — Aljezur & Costa Vicentina | Surf Rental",
		description:
			"Everything you need to know about surfing Arrifana, Monte Clérigo, Amoreira, and the best breaks on Portugal's Costa Vicentina.",
		url: `${SITE_URL}/surf-spots`,
	},
};

type Spot = {
	name: string;
	level: string;
	tideShort: string;
	seasonShort: string;
	beginnerFriendly: string;
	guideSlug: string;
	camSlug?: string;
	description: string;
	bestFor: string;
	bestTide: string;
	bestSeason: string;
	access: string;
};

const spots: Spot[] = [
	{
		name: "Praia da Arrifana",
		level: "All levels",
		tideShort: "All tides (mid–low best)",
		seasonShort: "Year-round",
		beginnerFriendly: "Yes",
		guideSlug: "arrifana-surf-guide",
		camSlug: "arrifana",
		description:
			"The most popular surf beach in the Aljezur area. Arrifana sits in a wide, cliff-backed bay that faces southwest — the high cliffs block north and northwest wind, so it stays cleaner and more surfable than the exposed beaches when the wind is up, and it's the most reliable spot around. The main beach break offers shifting peaks across a wide sandy stretch, plus a rock point at the north end.",
		bestFor:
			"Beginners stick to the middle section where the waves reform gently. Intermediate surfers head to the outside peaks for longer rides. When a solid NW swell wraps into the bay, the right-hand point at the north end (Canal / Kangaroos) — a rock reef, advanced only — fires.",
		bestTide: "Works on all tides; many prefer mid to low for more defined walls. Watch for rocks near the point.",
		bestSeason:
			"Year-round. Summer (Jun–Sep) brings smaller, mellow waves ideal for learning. Shoulder season (Apr–May, Oct) balances clean conditions with manageable swell. Winter (Nov–Mar) delivers powerful swells for experienced surfers.",
		access:
			"10-minute drive from Aljezur, 5 minutes from Vale da Telha. Parking at the top of the cliff with a short walk down.",
	},
	{
		name: "Monte Clérigo",
		level: "Beginner – Intermediate",
		tideShort: "Low to mid",
		seasonShort: "Summer & shoulder",
		beginnerFriendly: "On small days",
		guideSlug: "monte-clerigo-surf-guide",
		camSlug: "monte-clerigo",
		description:
			"A beautiful beach between dramatic cliffs, just north of Aljezur. Monte Clérigo faces west-northwest and is more open than sheltered Arrifana, so it catches more swell and usually breaks bigger. On small, clean days the inside is forgiving and great for improving — but it has more rocks and current than nearby Amoreira, so it pays to read it first.",
		bestFor:
			"Beginners and intermediates on the smaller, cleaner days — forgiving sand-bottom peaks for building confidence and working on turns. Because it's exposed, it can jump in size and the currents pick up.",
		bestTide: "Best low to mid tide. Watch the rocks at the north end and at low water.",
		bestSeason:
			"Best in summer and shoulder seasons when the swell is manageable. Gets bigger and more powerful in winter — check conditions before paddling out.",
		access:
			"15-minute drive from Aljezur. Small village with cafés and a restaurant overlooking the beach.",
	},
	{
		name: "Amoreira",
		level: "Beginner – Advanced",
		tideShort: "Low (lagoon) to high",
		seasonShort: "Year-round",
		beginnerFriendly: "Yes",
		guideSlug: "amoreira-surf-guide",
		camSlug: "amoreira",
		description:
			"A river-mouth beach break where the Aljezur river meets the Atlantic, backed by wild cliffs and dunes. The sandbanks shift with the river flow, so it ranges from mellow and beginner-friendly on a small summer swell to punchy and powerful when a bigger swell hits the outer banks. It's usually bigger than Arrifana and cleaner than Monte Clérigo, with fewer rocks and gentler currents — but the river-mouth current is always the thing to respect.",
		bestFor:
			"Beginners on small, clean days — a shallow lagoon forms at low tide, good for families. Intermediate to advanced when the outer banks and swell line up. Keep clear of the river-mouth current.",
		bestTide:
			"A friendly lagoon at low tide; the peaks near the river mouth work best mid to high. Bigger swells break further out.",
		bestSeason:
			"Works year-round — mellow in summer, and it really comes alive in autumn and winter with consistent northwest swells.",
		access:
			"10–15 minutes from Aljezur. Boardwalk through the dunes to the beach. Limited parking.",
	},
	{
		name: "Vale Figueiras",
		level: "Intermediate – Advanced",
		tideShort: "All tides, bank-dependent",
		seasonShort: "Autumn & winter",
		beginnerFriendly: "No",
		guideSlug: "vale-figueiras-surf-guide",
		description:
			"An exposed, wide-open beach break about 30 minutes south of Aljezur. Vale Figueiras faces roughly west and is a swell magnet — it catches energy when other spots are flat. Shifting sandbars throw up lefts and rights along a long, empty stretch, but it's powerful and rippy, and the access is a rough dirt track with no facilities.",
		bestFor:
			"Confident intermediate and advanced surfers after uncrowded peaks. On a small, clean day a coached group can find friendly corners, but the default is powerful with strong rip currents.",
		bestTide: "Works across tides, bank-dependent. Some nice barrels off the right sandbars at low.",
		bestSeason:
			"A year-round swell magnet thanks to its exposure — best in autumn and winter for size and shape. A good call when Arrifana is too small.",
		access:
			"30 minutes south from Aljezur via a dirt track; 4x4-friendly parking above the beach, no facilities. Strong rips — not a spot to surf alone.",
	},
	{
		name: "Canal / Kangaroos (Arrifana Point)",
		level: "Advanced",
		tideShort: "Mid tide",
		seasonShort: "Autumn & winter",
		beginnerFriendly: "No",
		guideSlug: "arrifana-surf-guide",
		camSlug: "arrifana",
		description:
			"A right-hand point that breaks over rock reef at the northern end of Arrifana bay. When a solid west or northwest swell wraps around the headland, it produces long, powerful, rippable walls — but the line-up is dotted with boils and exposed rocks, and it only starts working at size.",
		bestFor:
			"Experienced surfers only. Sharp rocks, boils, strong currents, and a heavy wave demand confidence and skill. When it's on, it's one of the best waves in the Algarve — but it's a separate reef, not the beginner-friendly beach break in the same bay.",
		bestTide: "Works best from mid tide. Low tide exposes too much rock.",
		bestSeason:
			"Autumn and winter, when big Atlantic swells make the Arrifana beach break too big. Rarely works in summer.",
		access:
			"Walk north along the rocks from Arrifana beach. Check conditions from the cliff before committing. Advanced only.",
	},
];

function spotSlug(name: string) {
	return name
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

/** Short label for the jump-nav chips. */
function shortName(name: string) {
	return name
		.replace(/^Praia d[ae] /, "")
		.replace(/\s*\(.*\)$/, "")
		.replace("Canal / Kangaroos", "Kangaroos");
}

export default function SurfSpotsPage() {
	const faq = faqJsonLd([
		{
			question: "Which surf spot near Aljezur is best for beginners?",
			answer:
				"Arrifana is the most reliable all-levels beach — beginners stick to the middle section where the waves reform gently. Amoreira is also beginner-friendly on small, clean days, with a shallow lagoon at low tide that suits families, and Monte Clérigo works for beginners on the smaller days too.",
		},
		{
			question: "What is the best tide for Arrifana?",
			answer:
				"Arrifana works on all tides, but many surfers prefer mid to low tide for more defined walls. Watch for rocks near the point at the north end of the bay.",
		},
		{
			question: "Is Amoreira safe for beginners?",
			answer:
				"Amoreira is beginner-friendly on small, clean days, when a shallow lagoon forms at low tide — good for families. It has fewer rocks and gentler currents than Monte Clérigo, but always keep clear of the river-mouth current, which is the main hazard.",
		},
		{
			question: "When is the best time to surf in Aljezur?",
			answer:
				"Summer (June–September) brings smaller, mellow waves ideal for beginners, with water around 17–19°C and a 3/2 wetsuit the norm. Shoulder season (April–May and October) is the sweet spot: moderate swells and fewer crowds. Winter (November–March) delivers powerful North Atlantic swells for experienced surfers.",
		},
		{
			question: "Which surf spots are near Aljezur?",
			answer:
				"The main breaks within 15–30 minutes of Aljezur are Praia da Arrifana (all levels, most sheltered), Monte Clérigo and Amoreira (both beginner-friendly on smaller days), Vale Figueiras (exposed, intermediate to advanced), and the Canal / Kangaroos reef at Arrifana point (advanced).",
		},
	]);

	const breadcrumb = breadcrumbJsonLd([
		{ name: "Home", url: SITE_URL },
		{ name: "Surf spots", url: `${SITE_URL}/surf-spots` },
	]);

	const spotList = {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: "Surf spots near Aljezur",
		itemListElement: spots.map((spot, i) => ({
			"@type": "ListItem",
			position: i + 1,
			item: {
				"@type": "TouristAttraction",
				name: spot.name,
				description: spot.description,
				url: `${SITE_URL}/surf-spots#spot-${spotSlug(spot.name)}`,
			},
		})),
	};

	const webPage = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		name: "Aljezur Surf Spots Guide — Arrifana, Amoreira & More",
		url: `${SITE_URL}/surf-spots`,
		dateModified: "2026-08-12",
	};

	return (
		<>
			<JsonLd data={faq} />
			<JsonLd data={breadcrumb} />
			<JsonLd data={spotList} />
			<JsonLd data={webPage} />
			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>Surf spots near Aljezur</h1>
							<p className="page-hero-sub">
								The best surf spots near Aljezur are Arrifana (all levels, most
								sheltered), Amoreira and Monte Clérigo (beginner-friendly on
								smaller days), and Carrapateira&apos;s Amado (more exposed) — all
								within 15–30 minutes.
							</p>
							<p className="page-hero-meta">Conditions reviewed August 2026.</p>
							<p className="page-hero-note">
								We&apos;ve delivered gear for 2,400+ sessions across these
								breaks, so the tips below come from what our customers actually
								find in the water.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<nav className="spot-jumpnav" aria-label="Jump to a surf spot">
				<div className="container spot-jumpnav-inner">
					<span className="spot-jumpnav-label">Jump to:</span>
					{spots.map((spot) => (
						<a
							key={spot.name}
							href={`#spot-${spotSlug(spot.name)}`}
							className="spot-jumpnav-chip"
						>
							{shortName(spot.name)}
						</a>
					))}
				</div>
			</nav>

			<HorizonLine />

			<section className="section" aria-labelledby="overview-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Overview</p>
							<h2 className="section-title" id="overview-heading">
								Which surf spots are near Aljezur?
							</h2>
							<p className="section-desc">
								All spots are within 15–30 minutes of Aljezur. The best spot on any given day
								depends on swell direction, size, and wind — we include local tips with every
								rental.
							</p>
						</div>
					</Reveal>

					<Reveal>
						<div className="spot-table-wrap">
							<table className="spot-table">
								<caption className="sr-only">
									Surf spots near Aljezur compared by level, tide, season,
									and how beginner-friendly they are.
								</caption>
								<thead>
									<tr>
										<th scope="col">Spot</th>
										<th scope="col">Level</th>
										<th scope="col">Best tide</th>
										<th scope="col">Best season</th>
										<th scope="col">Beginner-friendly</th>
									</tr>
								</thead>
								<tbody>
									{spots.map((spot) => (
										<tr key={spot.name}>
											<th scope="row">
												<a href={`#spot-${spotSlug(spot.name)}`}>
													{shortName(spot.name)}
												</a>
											</th>
											<td>{spot.level}</td>
											<td>{spot.tideShort}</td>
											<td>{spot.seasonShort}</td>
											<td>{spot.beginnerFriendly}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</Reveal>

					<Reveal>
						<div className="content-prose">
							<h3>When is the best time to surf near Aljezur?</h3>
							<p>
								<strong>Summer (June – September):</strong> The water sits around 17–19°C — this
								exposed coast runs a touch cooler than the south Algarve, so a 3/2 wetsuit is still
								the norm — and the waves mellow out. Perfect for beginners and families. Expect
								smaller, clean swells with light offshore winds in the morning.
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
					aria-labelledby={`spot-${spotSlug(spot.name)}`}
				>
					<div className="container">
						<Reveal>
							<div className="spot-detail">
								<div className="spot-detail-header">
									<span className="spot-level">{spot.level}</span>
									<h2
										className="section-title"
										id={`spot-${spotSlug(spot.name)}`}
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
						<Reveal>
							<div className="spot-detail-links">
								<a href={`/blog/${spot.guideSlug}`}>Full guide →</a>
								{spot.camSlug ? (
									<a href={`/surf-cams/${spot.camSlug}`}>Live conditions →</a>
								) : null}
							</div>
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
								What should you check before you paddle out?
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
