import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BoardCalculator } from "../components/board-calculator";
import { CtaSection } from "../components/cta-section";
import { JsonLd } from "../components/json-ld";
import { HorizonLine, Reveal } from "../components/reveal";
import { breadcrumbJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Surf Gear — Boards & Wetsuits",
	description:
		"Find the right surfboard and wetsuit for your level. We carry shortboards, funboards, and longboards with seasonal wetsuits — delivered free to your door in Aljezur.",
	alternates: { canonical: "/surf-gear" },
	openGraph: {
		title: "Surf Gear — Boards & Wetsuits | Wavebreak",
		description:
			"Shortboards, funboards, and longboards for every level. Seasonal wetsuits included. Free delivery on the Costa Vicentina.",
		url: `${SITE_URL}/surf-gear`,
	},
};

const boards = [
	{
		name: "Funboard",
		slug: "7'8",
		level: "Beginner – Intermediate",
		description:
			"Available in 7\u20190 and 7\u20198, our funboards are the sweet spot between stability and maneuverability. Plenty of volume to paddle into waves easily, with enough shape to start carving real turns. The 7\u20198 is bigger and great for first-timers, while the 7\u20190 suits riders ready to progress.",
		traits: ["Versatile all-rounder", "Easy paddling", "Forgiving & stable"],
		who: "Beginners catching their first waves and intermediate surfers looking to build technique without sacrificing wave count.",
	},
	{
		name: "Longboard",
		slug: "8'6",
		level: "Beginner & Longboarders",
		description:
			"A classic longboard shape with maximum stability and glide. The extra volume makes it perfect for beginners who want an easy ride, and the outline is shaped for longboarders looking to practice their cross step and nose riding.",
		traits: ["Maximum stability", "Early wave entry", "Nose-riding capable"],
		who: "Beginners who could use an extra-big board to catch more waves, and longboarders who want to work on their cross step and hang ten.",
	},
	{
		name: "Shortboard",
		slug: "6'6",
		level: "Advanced",
		description:
			"A responsive shortboard built for speed, sharp turns, and aerial maneuvers. Soft-top construction keeps it safe and durable while still delivering real performance. Best for experienced surfers comfortable in varied conditions.",
		traits: ["Fast & responsive", "Duck-dives easily", "Thruster fin setup"],
		who: "Experienced surfers who want to work the wave face, hit the lip, and generate speed.",
	},
] as const;

export default function SurfGearPage() {
	return (
		<>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", url: SITE_URL },
					{ name: "Surf Gear", url: `${SITE_URL}/surf-gear` },
				])}
			/>

			{/* Board size calculator */}
			<section className="page-hero" aria-labelledby="guide-heading">
				<div className="container">
					<Reveal>
						<div className="section-header">
							<p className="section-label">Board finder</p>
							<h1 className="section-title" id="guide-heading">
								Which surfboard is right for my level?
							</h1>
						<p className="section-desc">
							Not sure which board to pick? We carry three shapes — all soft
							tops — to cover every skill level, from your first wave to
							advanced sessions. We also provide seasonal wetsuits so you can
							focus on the surf.
						</p>
						<a href="#the-quiver" className="btn btn-outline scroll-down-btn">
							View our boards
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<line x1="12" y1="5" x2="12" y2="19" />
								<polyline points="19 12 12 19 5 12" />
							</svg>
						</a>
					</div>
					</Reveal>
					<BoardCalculator />
				</div>
			</section>

			<HorizonLine />

			{/* Board details */}
			<section id="the-quiver" className="section" aria-labelledby="picker-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">The quiver</p>
							<h2 className="section-title" id="picker-heading">
								Three shapes. Every wave.
							</h2>
							<p className="section-desc">
								All our boards are soft tops — safe, durable, and forgiving.
								Each one is cleaned, waxed, and inspected before every rental.
								Scroll through to find the shape that matches your experience.
							</p>
						</div>
					</Reveal>

					{/* Board detail cards */}
					{boards.map((board, i) => (
						<Reveal key={board.slug}>
							<div
								id={`board-${board.slug.replace("'", "-")}`}
								className={`board-detail ${i % 2 !== 0 ? "board-detail--reverse" : ""}`}
							>
								<div className="board-detail-gallery">
									<div className="board-detail-img board-detail-img--main">
										<Image
											src={`/images/rentals/${board.slug}/picture(1).jpg`}
											alt={`${board.name} — front view`}
											width={600}
											height={450}
										/>
									</div>
									<div className="board-detail-img board-detail-img--alt">
										<Image
											src={`/images/rentals/${board.slug}/picture(3).jpg`}
											alt={`${board.name} — detail`}
											width={600}
											height={450}
										/>
									</div>
								</div>
								<div className="board-detail-info">
									<span className="board-detail-level">{board.level}</span>
									<h3 className="board-detail-name">{board.name}</h3>
									<p className="board-detail-desc">{board.description}</p>
									<ul className="board-detail-traits">
										{board.traits.map((t) => (
											<li key={t}>{t}</li>
										))}
									</ul>
								<div className="board-detail-who">
									<strong>Best for:</strong> {board.who}
								</div>
								<Link href="/contact" className="btn btn-primary board-detail-cta">
									Book this board now!
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<line x1="5" y1="12" x2="19" y2="12" />
										<polyline points="12 5 19 12 12 19" />
									</svg>
								</Link>
							</div>
							</div>
						</Reveal>
					))}
				</div>
			</section>

			<HorizonLine />

			{/* Wetsuits */}
			<section className="section" aria-labelledby="wetsuits-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Wetsuits</p>
							<h2 className="section-title" id="wetsuits-heading">
								Wetsuits by season
							</h2>
							<p className="section-desc">
								The water temperature on the Costa Vicentina varies from 15°C in
								winter to 20°C in summer. We provide the right thickness for
								your dates — no guesswork needed.
							</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="grid-3">
							<article className="gear-card">
								<h3>Summer (Jun – Sep)</h3>
								<p className="gear-tag">3/2mm fullsuit or spring suit</p>
								<p>
									Water around 18–20°C. A light fullsuit keeps you comfortable
									for long sessions without overheating.
								</p>
							</article>
							<article className="gear-card">
								<h3>Shoulder (Apr – May, Oct)</h3>
								<p className="gear-tag">4/3mm fullsuit</p>
								<p>
									Water around 16–18°C. The standard thickness for the Algarve.
									Warm enough for dawn patrols.
								</p>
							</article>
							<article className="gear-card">
								<h3>Winter (Nov – Mar)</h3>
								<p className="gear-tag">4/3mm or 5/3mm fullsuit</p>
								<p>
									Water around 15–16°C. Thicker neoprene plus optional boots
									and gloves for the colder months.
								</p>
							</article>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			{/* Premium extras */}
			<section className="section section-alt" aria-labelledby="extras-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Premium extras</p>
							<h2 className="section-title" id="extras-heading">
								Everything you need, nothing to think about
							</h2>
							<p className="section-desc">
								Add a changing tub and roof rack pads to your rental for the complete
								hassle-free surf trip. Available as part of our{" "}
								<Link href="/pricing">Premium Package</Link>.
							</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="grid-3">
							<article className="gear-card">
								<h3>Changing tub</h3>
								<p className="gear-tag">Included in Premium Package</p>
								<p>
									A portable tub you stand in while changing out of your wetsuit. Keeps
									sand and water contained, and doubles as a rinse bucket for your
									wetsuit after a session. Essential for keeping your rental car clean.
								</p>
							</article>
							<article className="gear-card">
								<h3>Roof rack pads</h3>
								<p className="gear-tag">Included in Premium Package</p>
								<p>
									Soft rack pads with straps that fit any rental car. Transport your
									board safely on the roof without scratching the car or the board.
									We show you how to strap everything down on delivery.
								</p>
							</article>
							<article className="gear-card">
								<h3>Wax</h3>
								<p className="gear-tag">Included in all packages</p>
								<p>
									Fresh wax applied before every rental, matched to the water
									temperature. We use eco-friendly wax so you can surf with a
									clear conscience.
								</p>
							</article>
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection
				heading="Need help choosing?"
				text="Tell us your level, your dates, and what you want to surf — we'll put together the perfect setup."
			/>
		</>
	);
}
