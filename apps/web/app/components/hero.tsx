import Image from "next/image";
import Link from "next/link";
import { Reveal } from "./reveal";

export function Hero() {
	return (
		<section className="hero">
			<div className="container">
				<div className="hero-grid">
					<Reveal>
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
								<Link href="/surf-gear" className="btn btn-primary">
									Browse boards
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<line x1="5" y1="12" x2="19" y2="12" />
										<polyline points="12 5 19 12 12 19" />
									</svg>
								</Link>
								<Link href="/how-it-works" className="btn btn-ghost">
									How it works
								</Link>
							</div>
						</div>
					</Reveal>
					<Reveal delay={120}>
						<div className="hero-visual">
							<Link href="/surf-gear#board-7-8" className="hero-card">
								<div className="hero-card-img">
									<Image
										src="/images/rentals/7'8/picture(1).jpg"
										alt="7'8 Funboard"
										width={600}
										height={450}
									/>
								</div>
								<div className="hero-card-body">
									<div className="hero-card-row">
										<div className="hero-card-label">Funboard</div>
										<div className="hero-card-price"><span className="hero-card-from">from</span> &euro;11 <small>/day</small></div>
									</div>
									<div className="hero-card-sub">7&apos;8&quot; &middot; Stability meets maneuverability</div>
									<div className="hero-card-tag">Most rented</div>
								</div>
							</Link>
						</div>
					</Reveal>
				</div>
			</div>
		</section>
	);
}
