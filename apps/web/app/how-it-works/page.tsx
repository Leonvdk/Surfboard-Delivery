import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "../components/cta-section";
import NewsletterPopup from "../components/newsletter-popup";
import { HorizonLine, Reveal } from "../components/reveal";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "How It Works — Surfboard Delivery to Your Accommodation",
	description:
		"Book your surf gear in 3 simple steps: send us your dates, we deliver to your door in Aljezur, and we pick up before checkout. No queues, no car racks, no deposit hassle.",
	alternates: { canonical: "/how-it-works" },
	openGraph: {
		title: "How It Works | Surf Rental Aljezur",
		description:
			"3-step surfboard and wetsuit rental delivery to your accommodation in Aljezur, Arrifana, and Vale da Telha.",
		url: `${SITE_URL}/how-it-works`,
	},
};

export default function HowItWorksPage() {
	return (
		<>
			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>How it works</h1>
							<p className="page-hero-sub">
								No surf shop queues. No wrestling boards onto your car. We handle the logistics so you
								can focus on the waves.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section steps-section" aria-labelledby="steps-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Three steps</p>
							<h2 className="section-title" id="steps-heading">
								The process
							</h2>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="steps-detailed">
							<div className="step-detailed">
								<div className="step-number-large">1</div>
								<div className="step-content">
									<h3>Tell us about your trip</h3>
									<p>
										Send us a message via our <Link href="/contact">contact form</Link>, email, or
										WhatsApp with:
									</p>
									<ul>
										<li>Your check-in and checkout dates</li>
										<li>
											Your accommodation address (Aljezur, Arrifana, Vale da Telha, or Monte
											Clérigo)
										</li>
										<li>How many people need gear</li>
										<li>Your surfing experience level</li>
									</ul>
									<p>
										We&apos;ll reply within 24 hours with a gear recommendation and confirm your
										booking.
									</p>
								</div>
							</div>

							<div className="step-detailed">
								<div className="step-number-large">2</div>
								<div className="step-content">
									<h3>We deliver to your door</h3>
									<p>
										On your check-in day, we deliver everything to your accommodation. Boards,
										wetsuits, leashes, wax — all ready to go. We&apos;ll walk you through the gear
										and share our best tips for the current conditions:
									</p>
									<ul>
										<li>Which beach is working best right now</li>
										<li>Best tide windows for your level</li>
										<li>Where to park and how to access the beach</li>
										<li>Where to eat and grab coffee after your session</li>
									</ul>
								</div>
							</div>

							<div className="step-detailed">
								<div className="step-number-large">3</div>
								<div className="step-content">
									<h3>Surf your heart out, then we pick up</h3>
									<p>
										For the rest of your stay, the gear is yours. Surf every day, try different
										spots, take a rest day — it&apos;s your holiday. On your last day (or the day
										before checkout), we come back to collect everything.
									</p>
									<p>
										<strong>Need to swap a board mid-stay?</strong> Our Extended Stay package
										includes a free board swap. Or just ask — we&apos;re flexible.
									</p>
								</div>
							</div>
							<div className="steps-cta">
								<Link href="/contact" className="btn btn-primary">
									Book your gear now
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<line x1="5" y1="12" x2="19" y2="12" />
										<polyline points="12 5 19 12 12 19" />
									</svg>
								</Link>
							</div>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section section-alt" aria-labelledby="delivery-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Delivery area</p>
							<h2 className="section-title" id="delivery-heading">
								Where we deliver
							</h2>
							<p className="section-desc">
								Free delivery to all accommodations in the Aljezur area.
							</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="grid-4">
							<div className="area-card">
								<h3>Aljezur</h3>
								<p>Town centre and surroundings</p>
							</div>
							<div className="area-card">
								<h3>Arrifana</h3>
								<p>Village and cliffside</p>
							</div>
							<div className="area-card">
								<h3>Vale da Telha</h3>
								<p>Urbanização and villas</p>
							</div>
							<div className="area-card">
								<h3>Monte Clérigo</h3>
								<p>Beach village and hills</p>
							</div>
						</div>
					</Reveal>
					<p className="pricing-note">
						Staying somewhere nearby but not listed? <Link href="/contact">Ask us</Link> — we may
						still be able to deliver.
					</p>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="whynot-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Our philosophy</p>
							<h2 className="section-title" id="whynot-heading">
								Why weekly rentals?
							</h2>
						</div>
					</Reveal>
					<Reveal>
						<div className="content-prose">
							<p>
								We chose a one-week minimum for a simple reason: it&apos;s better for everyone. You
								get the freedom to surf whenever conditions are right — without worrying about daily
								return times or extra fees.
							</p>
							<p>
								Most people visiting the Aljezur area stay for at least a week anyway. If you&apos;re
								here for a shorter trip and need gear, check out{" "}
								<a href="https://arrifanasurfschool.com" target="_blank" rel="noopener noreferrer">
									Arrifana Surf School
								</a>{" "}
								at the beach — they do daily rentals from their surf hut.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection />

			<NewsletterPopup />
		</>
	);
}
