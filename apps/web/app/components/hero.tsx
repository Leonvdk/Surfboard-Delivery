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
							Tell us your level and dates — we&apos;ll pick the right board
							and wetsuit and drop them at your Airbnb. No shop queue, no
							wrong board on day one.
						</p>
						<div className="hero-actions">
							<TrackedCtaLink href="/contact" className="btn btn-primary" ctaText="Book now" ctaLocation="hero">
								Book now
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<line x1="5" y1="12" x2="19" y2="12" />
									<polyline points="12 5 19 12 12 19" />
								</svg>
							</TrackedCtaLink>
							<TrackedCtaLink href="/how-it-works" className="btn btn-outline" ctaText="How it works" ctaLocation="hero">
								How it works
							</TrackedCtaLink>
						</div>
						<p className="hero-microcopy">
							No minimum order · reply within 24h in 5 languages · pay on
							arrival possible
						</p>
					</div>
					<div className="hero-visual">
						<HeroCalculator />
					</div>
				</div>
			</div>
		</section>
	);
}
