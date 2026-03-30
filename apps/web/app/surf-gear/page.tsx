import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BoardCalculator } from "../components/board-calculator";
import { CtaSection } from "../components/cta-section";
import { HorizonLine, Reveal } from "../components/reveal";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Surf Gear — Boards & Wetsuits",
	description:
		"Find the right surfboard and wetsuit for your level. We carry shortboards, funboards, and longboards with seasonal wetsuits — delivered free to your door in Aljezur.",
	alternates: { canonical: "/surf-gear" },
	openGraph: {
		title: "Surf Gear — Boards & Wetsuits | Surf Rental Aljezur",
		description:
			"Shortboards, funboards, and longboards for every level. Seasonal wetsuits included. Free delivery on the Costa Vicentina.",
		url: `${SITE_URL}/surf-gear`,
	},
};

const boards = [
	{
		name: "7\u20190 Funboard",
		slug: "7'0",
		level: "Beginner – Intermediate",
		description:
			"A compact funboard that bridges the gap between a longboard and a shortboard. Easier to maneuver than the 7\u20198 while still offering plenty of volume for easy paddling. Great for riders ready to progress beyond a bigger board.",
		traits: ["Versatile all-rounder", "Easy to maneuver", "Compact & responsive"],
		who: "Intermediate surfers looking to build technique without sacrificing wave count, and confident beginners ready to size down.",
	},
	{
		name: "7\u20198 Funboard",
		slug: "7'8",
		level: "Beginner – Intermediate",
		description:
			"Our bigger funboard with extra volume for easy paddling and stability. The sweet spot between a longboard and a shortboard — forgiving enough for first-timers, with enough shape to start carving real turns.",
		traits: ["Versatile all-rounder", "Easy paddling", "Forgiving & stable"],
		who: "Beginners catching their first waves and intermediate surfers who want a stable, confidence-building board.",
	},
	{
		name: "8\u20196 Longboard",
		slug: "8'6",
		level: "Beginner & Longboarders",
		description:
			"A classic longboard shape with maximum stability and glide. The extra volume makes it perfect for beginners who want an easy ride, and the outline is shaped for longboarders looking to practice their cross step and nose riding.",
		traits: ["Maximum stability", "Early wave entry", "Nose-riding capable"],
		who: "Beginners who could use an extra-big board to catch more waves, and longboarders who want to work on their cross step and hang ten.",
	},
	{
		name: "6\u20196 Shortboard",
		slug: "6'6",
		level: "Intermediate – Advanced",
		description:
			"A responsive shortboard built for speed, sharp turns, and aerial maneuvers. Soft-top construction keeps it safe and durable while still delivering real performance. Best for experienced surfers comfortable in varied conditions.",
		traits: ["Fast & responsive", "Duck-dives easily", "Thruster fin setup"],
		who: "Experienced surfers who want to work the wave face, hit the lip, and generate speed.",
	},
] as const;

export default function SurfGearPage() {
	return (
		<>
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
							Not sure which board to pick? We carry four shapes — all soft
							tops — to cover every skill level, from your first wave to
							advanced sessions. We also provide seasonal wetsuits so you can
							focus on the surf.
						</p>
						<div className="hero-btn-row">
							<a href="#the-quiver" className="btn btn-outline scroll-down-btn boards-btn">
								<span className="boards-btn-desktop">View our boards</span>
								<span className="boards-btn-mobile">Go to our gear calculator</span>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<line x1="12" y1="5" x2="12" y2="19" />
									<polyline points="19 12 12 19 5 12" />
								</svg>
							</a>
							<a href="#extras-heading" className="btn btn-primary scroll-down-btn">
								Check out our Premium Package
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<line x1="12" y1="5" x2="12" y2="19" />
									<polyline points="19 12 12 19 5 12" />
								</svg>
							</a>
						</div>
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
								Four shapes. Every wave.
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
									<div className={`board-detail-img board-detail-img--main${"crossfadeSlug" in board ? " board-detail-img--crossfade" : ""}`}>
										{"crossfadeSlug" in board ? (
											<>
												<Image
													src={`/images/rentals/${board.slug}/picture(1).jpg`}
													alt={`${board.name} ${board.slug} — front view`}
													width={600}
													height={450}
													className="crossfade-img crossfade-img--a"
												/>
												<Image
													src={`/images/rentals/${board.crossfadeSlug}/picture(1).jpg`}
													alt={`${board.name} ${board.crossfadeSlug} — front view`}
													width={600}
													height={450}
													className="crossfade-img crossfade-img--b"
												/>
											</>
										) : (
											<Image
												src={`/images/rentals/${board.slug}/picture(1).jpg`}
												alt={`${board.name} — front view`}
												width={600}
												height={450}
											/>
										)}
									</div>
									{"altThumbnailSlug" in board ? (
										<>
											<div className="board-detail-img board-detail-img--alt">
												<Image
													src={`/images/rentals/${board.altThumbnailSlug}/picture(3).jpg`}
													alt={`${board.name} ${board.altThumbnailSlug} — detail`}
													width={600}
													height={450}
												/>
											</div>
											<div className="board-detail-img board-detail-img--alt">
												<Image
													src={`/images/rentals/${board.slug}/picture(3).jpg`}
													alt={`${board.name} ${board.slug} — detail`}
													width={600}
													height={450}
												/>
											</div>
										</>
									) : (
										<div className="board-detail-img board-detail-img--alt">
											<Image
												src={`/images/rentals/${board.slug}/picture(3).jpg`}
												alt={`${board.name} — detail`}
												width={600}
												height={450}
											/>
										</div>
									)}
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
								<Link href={`/contact?board=${encodeURIComponent(board.slug)}`} className="btn btn-primary board-detail-cta">
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
							<article className="gear-card gear-card--summer">
								<div className="gear-card-accent" />
								<div className="gear-card-header">
									<div className="gear-card-temp">18–20°C</div>
									<h3>Summer</h3>
									<p className="gear-card-months">Jun – Sep</p>
								</div>
								<p className="gear-tag">3/2mm fullsuit or spring suit</p>
								<p>
									A light fullsuit keeps you comfortable for long sessions
									without overheating.
								</p>
							</article>
							<article className="gear-card gear-card--shoulder">
								<div className="gear-card-accent" />
								<div className="gear-card-header">
									<div className="gear-card-temp">16–18°C</div>
									<h3>Shoulder</h3>
									<p className="gear-card-months">Apr – May, Oct</p>
								</div>
								<p className="gear-tag">4/3mm fullsuit</p>
								<p>
									The standard thickness for the Algarve. Warm enough for
									dawn patrols.
								</p>
							</article>
							<article className="gear-card gear-card--winter">
								<div className="gear-card-accent" />
								<div className="gear-card-header">
									<div className="gear-card-temp">15–16°C</div>
									<h3>Winter</h3>
									<p className="gear-card-months">Nov – Mar</p>
								</div>
								<p className="gear-tag">4/3mm or 5/3mm fullsuit</p>
								<p>
									Thicker neoprene plus optional boots and gloves for the
									colder months.
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
								Add a changing mat and roof rack pads to your rental for the complete
								hassle-free surf trip. Available as part of our{" "}
								<Link href="/pricing">Premium Package</Link>.
							</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="grid-3">
							<article className="extras-card">
								<div className="extras-img">
									<Image
										src="/images/rentals/changing-mat/picture.jpg"
										alt="Changing mat for surfers"
										fill
										sizes="(max-width: 640px) 100vw, 33vw"
									/>
								</div>
								<h3>Changing mat</h3>
								<span className="extras-badge">Premium Package</span>
								<p>
									A portable mat you stand on while changing. Keeps sand
									contained and doubles as a bag for your wetsuit after a session.
								</p>
							</article>
							<article className="extras-card">
								<div className="extras-img">
									<Image
										src="/images/rentals/soft-racks/picture.jpg"
										alt="Soft roof rack pads for surfboards"
										fill
										sizes="(max-width: 640px) 100vw, 33vw"
									/>
								</div>
								<h3>Roof rack pads</h3>
								<span className="extras-badge">Premium Package</span>
								<p>
									Soft rack pads with straps that fit any rental car. We show
									you how to strap everything down on delivery.
								</p>
							</article>
							<article className="extras-card">
								<div className="extras-img extras-img--crossfade extras-img--poncho">
									<Image
										src="/images/rentals/poncho/picture(1).png"
										alt="Surf poncho — front"
										fill
										sizes="(max-width: 640px) 100vw, 33vw"
										className="crossfade-img crossfade-img--a"
									/>
									<Image
										src="/images/rentals/poncho/picture(2).png"
										alt="Surf poncho — detail"
										fill
										sizes="(max-width: 640px) 100vw, 33vw"
										className="crossfade-img crossfade-img--b"
									/>
									<Image
										src="/images/rentals/poncho/picture(5).png"
										alt="Surf poncho — in use"
										fill
										sizes="(max-width: 640px) 100vw, 33vw"
										className="poncho-hover-img"
									/>
								</div>
								<h3>Poncho</h3>
								<span className="extras-badge">Premium Package</span>
								<p>
									A warm changing poncho for getting in and out of your wetsuit
									at the beach. Keeps you covered and warm after a session.
								</p>
							</article>
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection
				heading="Need help choosing?"
				text="Tell us your level, your dates, and what you want to surf — we'll put together the perfect setup."
				buttonText="Go to our gear calculator"
				buttonHref="#guide-heading"
			/>
		</>
	);
}
