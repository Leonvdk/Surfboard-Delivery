import { TrackedCtaLink } from "./tracked-cta-link";
import { HeroCalculator } from "./hero-calculator";

export function Hero() {
	return (
		<section className="hero">
			<div className="container">
				<div className="hero-grid">
					<div className="hero-content">
						<p className="hero-eyebrow">Surfboard Rental Delivery — Aljezur, Arrifana & Vale da Telha</p>
						<h1 className="hero-title">
							Surfboards.<br />Wetsuits.<br /><em>Delivered.</em>
						</h1>
						<p className="hero-desc">
							Premium surfboards for every skill level, delivered to your Airbnb.
							Choose your shape, book in seconds, gear secured.
						</p>
						<div className="hero-actions">
							<TrackedCtaLink href="/surf-gear" className="btn btn-primary" ctaText="Browse boards" ctaLocation="hero">
								Browse boards
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<line x1="5" y1="12" x2="19" y2="12" />
									<polyline points="12 5 19 12 12 19" />
								</svg>
							</TrackedCtaLink>
							<TrackedCtaLink href="/how-it-works" className="btn btn-outline" ctaText="How it works" ctaLocation="hero">
								How it works
							</TrackedCtaLink>
						</div>
					</div>
					<div className="hero-visual">
						<HeroCalculator />
					</div>
				</div>
			</div>
		</section>
	);
}
