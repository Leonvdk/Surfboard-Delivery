import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "../components/cta-section";
import { JsonLd } from "../components/json-ld";
import { HorizonLine, Reveal } from "../components/reveal";
import { breadcrumbJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";
import { CAM_SPOTS } from "./_data";

export const metadata: Metadata = {
	title: "Live Surf Cams — Arrifana, Monte Clérigo, Amoreira & Odeceixe",
	description:
		"Live surf cams for the best beaches near Aljezur on the Costa Vicentina. Check the waves at Arrifana, Monte Clérigo, Amoreira, and Odeceixe in real time before you paddle out.",
	alternates: { canonical: "/surf-cams" },
	openGraph: {
		title: "Live Surf Cams — Aljezur & Costa Vicentina | Surf Rental",
		description:
			"Check the waves in real time at Arrifana, Monte Clérigo, Amoreira, and Odeceixe before you head down.",
		url: `${SITE_URL}/surf-cams`,
	},
};

export default function SurfCamsPage() {
	return (
		<>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", url: SITE_URL },
					{ name: "Surf Cams", url: `${SITE_URL}/surf-cams` },
				])}
			/>

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>Live surf cams near Aljezur</h1>
							<p className="page-hero-sub">
								Check the waves before you go. Live cams for the best beaches on the Costa Vicentina
								— see the size, the wind, and how busy it is in real time.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="cams-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Live now</p>
							<h2 className="section-title" id="cams-heading">
								Pick a beach
							</h2>
							<p className="section-desc">
								All four are within a 20-minute drive of Aljezur. Tap through for the live cam,
								today&apos;s conditions, and how to get there.
							</p>
						</div>
					</Reveal>

					<Reveal stagger>
						<div className="grid-2-narrow surfcam-grid">
							{CAM_SPOTS.map((spot) => (
								<Link key={spot.slug} href={`/surf-cams/${spot.slug}`} className="surfcam-card">
									<div className="surfcam-card-body">
										<span className="spot-level">{spot.level}</span>
										<h3 className="surfcam-card-title">{spot.name}</h3>
										<p className="surfcam-card-desc">{spot.tagline}</p>
										<span className="surfcam-card-cta">
											Watch the live cam
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
												aria-hidden="true"
											>
												<line x1="5" y1="12" x2="19" y2="12" />
												<polyline points="12 5 19 12 12 19" />
											</svg>
										</span>
									</div>
								</Link>
							))}
						</div>
					</Reveal>
				</div>
			</section>

			<section className="section section-alt" aria-labelledby="why-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Local tip</p>
							<h2 className="section-title" id="why-heading">
								Read the cam like a local
							</h2>
						</div>
					</Reveal>
					<Reveal>
						<div className="content-prose">
							<p>
								The Costa Vicentina faces the open Atlantic, so conditions change fast. A quick look
								at the cam saves you a wasted drive — and tells you which beach is working best
								today. Two things to check:
							</p>
							<ul>
								<li>
									<strong>Wind.</strong> Glassy or light offshore (blowing off the land) means clean
									waves. If the cam looks bumpy and textured, it&apos;s likely onshore — try a more
									sheltered spot like Arrifana.
								</li>
								<li>
									<strong>Size &amp; crowd.</strong> Watch a few sets roll through. Too big for you
									at one beach usually means a friendlier neighbour is a short drive away.
								</li>
							</ul>
							<p>
								Not sure which board suits the day? That&apos;s our job — we match your gear to your
								level and the conditions, and deliver it to your door.{" "}
								<Link href="/surf-spots">See the full surf-spot guide</Link> for tides and seasons.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection
				heading="Waves look good? Gear at your door."
				text="We deliver surfboards and wetsuits across Aljezur, Arrifana and the Costa Vicentina — matched to your level and today's conditions."
				buttonText="Reserve your gear"
			/>
		</>
	);
}
