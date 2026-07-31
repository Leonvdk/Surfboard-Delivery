import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CamLinkCard } from "../../components/cam-link-card";
import { CtaSection } from "../../components/cta-section";
import { JsonLd } from "../../components/json-ld";
import { HorizonLine, Reveal } from "../../components/reveal";
import { breadcrumbJsonLd } from "../../lib/jsonld";
import { SITE_URL } from "../../lib/metadata";
import { CAM_SPOTS, getCamSpot } from "../_data";

interface Props {
	params: Promise<{ spot: string }>;
}

export function generateStaticParams() {
	return CAM_SPOTS.map((s) => ({ spot: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { spot: slug } = await params;
	const spot = getCamSpot(slug);
	if (!spot) return {};
	const title = `${spot.name} Surf Cam — Live`;
	const description = `Live surf cam for ${spot.fullName} near Aljezur. Check the waves, wind, and crowd in real time before you paddle out — plus today's best conditions and how to get there.`;
	return {
		title,
		description,
		alternates: { canonical: `/surf-cams/${spot.slug}` },
		openGraph: {
			title: `${spot.name} Surf Cam — Live | Surf Rental Aljezur`,
			description,
			url: `${SITE_URL}/surf-cams/${spot.slug}`,
		},
	};
}

export default async function CamDetailPage({ params }: Props) {
	const { spot: slug } = await params;
	const spot = getCamSpot(slug);
	if (!spot) notFound();

	const others = CAM_SPOTS.filter((s) => s.slug !== spot.slug);

	return (
		<>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", url: SITE_URL },
					{ name: "Surf Cams", url: `${SITE_URL}/surf-cams` },
					{ name: spot.name, url: `${SITE_URL}/surf-cams/${spot.slug}` },
				])}
			/>

			<section className="page-hero surfcam-hero">
				<div className="container">
					<Reveal>
						<div>
							<p className="section-label">Live surf cam</p>
							<h1>{spot.name} surf cam</h1>
							<p className="page-hero-sub">{spot.tagline}</p>
						</div>
					</Reveal>
				</div>
			</section>

			{/* Lead with the live stream. */}
			<section className="section surfcam-live-section" aria-label={`Live ${spot.name} webcam`}>
				<div className="container">
					<Reveal>
						<CamLinkCard href={spot.beachcamUrl} name={spot.fullName} />
						<p className="surfcam-caption">
							We can&apos;t play the live feed directly on our site just yet — but
							it&apos;s one tap away on MEO Beachcam, always free and live.
						</p>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="conditions-heading">
				<div className="container">
					<Reveal>
						<div className="spot-detail">
							<div className="spot-detail-header">
								<span className="spot-level">{spot.level}</span>
								<h2 className="section-title" id="conditions-heading">
									{spot.fullName}
								</h2>
							</div>
							<p className="spot-detail-desc">{spot.blurb}</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<dl className="spot-detail-grid">
							<div className="spot-detail-item">
								<dt>Best conditions</dt>
								<dd>{spot.bestConditions}</dd>
							</div>
							<div className="spot-detail-item">
								<dt>Who it suits</dt>
								<dd>{spot.whoFor}</dd>
							</div>
							<div className="spot-detail-item">
								<dt>Getting there</dt>
								<dd>
									{spot.access}{" "}
									<a href={spot.mapsUrl} target="_blank" rel="noopener noreferrer">
										Open in Maps →
									</a>
								</dd>
							</div>
						</dl>
					</Reveal>
				</div>
			</section>

			<section className="section section-alt" aria-labelledby="others-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Nearby</p>
							<h2 className="section-title" id="others-heading">
								Other live cams
							</h2>
							<p className="section-desc">
								Wrong wind or too big here? A friendlier beach is usually minutes away.
							</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="grid-2-narrow surfcam-grid">
							{others.map((o) => (
								<Link key={o.slug} href={`/surf-cams/${o.slug}`} className="surfcam-card">
									<div className="surfcam-card-body">
										<span className="spot-level">{o.level}</span>
										<h3 className="surfcam-card-title">{o.name}</h3>
										<p className="surfcam-card-desc">{o.tagline}</p>
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

			<CtaSection
				heading={`Surfing ${spot.name}? We'll bring the gear.`}
				text="Surfboards and wetsuits delivered to your door across the Costa Vicentina — matched to your level and the day's conditions."
				buttonText="Reserve your gear"
			/>
		</>
	);
}
