import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaSection } from "./components/cta-section";
import { Hero } from "./components/hero";
import NewsletterPopup from "./components/newsletter-popup";
import { Reveal } from "./components/reveal";
import { StarRating } from "./components/star-rating";
import { prices } from "./lib/pricing";

export const metadata: Metadata = {
	title: "Surf Rental Aljezur — Surfboard & Wetsuit Rental Delivered to Your Door",
	description:
		"Rent surfboards and wetsuits delivered to your accommodation in Aljezur, Arrifana, and Vale da Telha. Free delivery and pickup on the Costa Vicentina.",
	alternates: { canonical: "/" },
};

const boardFromPrice = Math.ceil(
	prices.boardOnly.extended.amount / 14,
);

export default function Home() {
	return (
		<>
			<Hero />

			{/* Metrics */}
			<section className="metrics" aria-label="Key figures">
				<div className="container">
					<Reveal stagger>
						<div className="metrics-grid">
							<div className="metric">
								<div className="metric-value">2,400+</div>
								<div className="metric-label">Sessions last year</div>
							</div>
							<div className="metric">
								<div className="metric-value">4</div>
								<div className="metric-label">Board models</div>
							</div>
							<div className="metric">
								<div className="metric-value">4.9</div>
								<div className="metric-label">Average rating</div>
							</div>
							<div className="metric">
								<div className="metric-value metric-value--xl">&infin;</div>
								<div className="metric-label">Possibilities</div>
							</div>
						</div>
					</Reveal>
				</div>
			</section>

			{/* Boards */}
			<section className="boards" id="boards">
				<div className="container">
					<Reveal>
						<div className="section-header section-header--center">
							<p className="section-eyebrow">The collection</p>
							<h2 className="section-title">Four shapes. Every wave.</h2>
							<p className="section-desc">
								Each board is cleaned, waxed, and inspected before every rental.
								Pick the shape that matches your experience.
							</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="boards-grid">
							<Link href="/surf-gear#board-6-6" className="board-card-link">
								<article className="board-card">
									<div className="board-card-img">
										<Image
											className="board-card-img-default"
											src="/images/rentals/6'6/picture(1).jpg"
											alt="6'6 Shortboard"
											width={600}
											height={450}
										/>
										<Image
											className="board-card-img-hover"
											src="/images/rentals/6'6/picture(3).jpg"
											alt=""
											width={600}
											height={450}
											aria-hidden="true"
										/>
									</div>
									<div className="board-card-body">
										<h3 className="board-card-title">6&#8217;6 Shortboard</h3>
										<p className="board-card-desc">
											Built for speed, sharp turns, and aerial maneuvers. For
											experienced surfers chasing performance.
										</p>
										<div className="board-card-footer">
											<div className="board-card-price">from &euro;{boardFromPrice} <small>/day</small></div>
											<span className="board-card-level">Intermediate – Advanced</span>
										</div>
									</div>
								</article>
							</Link>

							<Link href="/surf-gear#board-7-0" className="board-card-link">
								<article className="board-card">
									<div className="board-card-img">
										<Image
											className="board-card-img-default"
											src="/images/rentals/7'0/picture(1).jpg"
											alt="7'0 Funboard"
											width={600}
											height={450}
										/>
										<Image
											className="board-card-img-hover"
											src="/images/rentals/7'0/picture(3).jpg"
											alt=""
											width={600}
											height={450}
											aria-hidden="true"
										/>
									</div>
									<div className="board-card-body">
										<h3 className="board-card-title">7&#8217;0 Funboard</h3>
										<p className="board-card-desc">
											A step up from the beginner board. Easier to maneuver
											while still forgiving enough to build confidence.
										</p>
										<div className="board-card-footer">
											<div className="board-card-price">from &euro;{boardFromPrice} <small>/day</small></div>
											<span className="board-card-level">Beginner – Intermediate</span>
										</div>
									</div>
								</article>
							</Link>

							<Link href="/surf-gear#board-7-8" className="board-card-link">
								<article className="board-card">
									<div className="board-card-img">
										<Image
											className="board-card-img-default"
											src="/images/rentals/7'8/picture(1).jpg"
											alt="7'8 Funboard"
											width={600}
											height={450}
										/>
										<Image
											className="board-card-img-hover"
											src="/images/rentals/7'8/picture(3).jpg"
											alt=""
											width={600}
											height={450}
											aria-hidden="true"
										/>
									</div>
									<div className="board-card-body">
										<h3 className="board-card-title">7&#8217;8 Funboard</h3>
										<p className="board-card-desc">
											The middle ground. Enough stability to catch waves easily,
											enough response to start carving turns.
										</p>
										<div className="board-card-footer">
											<div className="board-card-price">from &euro;{boardFromPrice} <small>/day</small></div>
											<span className="board-card-level">Beginner – Intermediate</span>
										</div>
									</div>
								</article>
							</Link>

							<Link href="/surf-gear#board-8-6" className="board-card-link">
								<article className="board-card">
									<div className="board-card-img">
										<Image
											className="board-card-img-default"
											src="/images/rentals/8'6/picture(1).jpg"
											alt="8'6 Longboard"
											width={600}
											height={450}
										/>
										<Image
											className="board-card-img-hover"
											src="/images/rentals/8'6/picture(3).jpg"
											alt=""
											width={600}
											height={450}
											aria-hidden="true"
										/>
									</div>
									<div className="board-card-body">
										<h3 className="board-card-title">8&#8217;6 Longboard</h3>
										<p className="board-card-desc">
											Stable and forgiving. Perfect for catching every wave,
											whether you are starting out or cruising.
										</p>
										<div className="board-card-footer">
											<div className="board-card-price">from &euro;{boardFromPrice} <small>/day</small></div>
											<span className="board-card-level">Beginner &amp; Longboarder</span>
										</div>
									</div>
								</article>
							</Link>
						</div>
					</Reveal>
				</div>
			</section>

			{/* How It Works */}
			<section className="how" id="how">
				<div className="container">
					<div className="how-layout">
						<Reveal>
							<div className="section-header">
								<p className="section-eyebrow">The process</p>
								<h2 className="section-title">
									Booking to<br />securing your waves<br />in 10 minutes.
								</h2>
							</div>
						</Reveal>
						<Reveal stagger>
							<div className="steps">
								<div className="step">
									<div className="step-number">01</div>
									<div>
										<h3 className="step-title">Choose your board</h3>
										<p className="step-desc">
											Browse our boards online and tell us your level.
											We'll recommend the right shape for the conditions
											and deliver it to your door.
										</p>
									</div>
								</div>
								<div className="step">
									<div className="step-number">02</div>
									<div>
										<h3 className="step-title">Book and pay</h3>
										<p className="step-desc">
											Reserve for an hour, a day, or a full week. Transparent
											pricing, no hidden fees. Pay online or on-site.
										</p>
									</div>
								</div>
								<div className="step">
									<div className="step-number">03</div>
									<div>
										<h3 className="step-title">Paddle out</h3>
										<p className="step-desc">
											Pick up your board, get a quick safety brief, and head
											to the water. Return it when you are done.
										</p>
									</div>
								</div>
							</div>
							<div className="how-cta">
								<Link href="/surf-gear" className="btn btn-primary">
									Rent a surfboard
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<line x1="5" y1="12" x2="19" y2="12" />
										<polyline points="12 5 19 12 12 19" />
									</svg>
								</Link>
							</div>
						</Reveal>
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<section className="testimonials" id="reviews">
				<div className="container">
					<Reveal>
						<div className="section-header section-header--center">
							<p className="section-eyebrow">What riders say</p>
							<h2 className="section-title">Trusted by surfers across Europe.</h2>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="testimonials-grid">
							<div className="testimonial-card">
								<StarRating />
								<p className="testimonial-quote">
									Rented a longboard for a full week. Board was in perfect
									condition, and the staff gave excellent local spot
									recommendations.
								</p>
								<div className="testimonial-author">
									<div className="testimonial-avatar">MK</div>
									<div>
										<div className="testimonial-name">Mara K.</div>
										<div className="testimonial-meta">from Fuerteventura, Apr 2026</div>
									</div>
								</div>
							</div>

							<div className="testimonial-card">
								<StarRating />
								<p className="testimonial-quote">
									First time surfing. They matched me with the right board and I
									caught my first wave within an hour. Coming back next summer.
								</p>
								<div className="testimonial-author">
									<div className="testimonial-avatar">JV</div>
									<div>
										<div className="testimonial-name">Joost V.</div>
										<div className="testimonial-meta">from Scheveningen, Jul 2025</div>
									</div>
								</div>
							</div>

							<div className="testimonial-card">
								<StarRating />
								<p className="testimonial-quote">
									Shortboard selection is top-notch. Clean, well-maintained boards
									and the pickup process is seamless. Best rental experience in
									Europe.
								</p>
								<div className="testimonial-author">
									<div className="testimonial-avatar">SL</div>
									<div>
										<div className="testimonial-name">Sofia L.</div>
										<div className="testimonial-meta">from Biarritz, Sep 2025</div>
									</div>
								</div>
							</div>
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection
				heading="Need help choosing?"
				text="Tell us your level, your dates, and what you want to surf — we'll put together the perfect setup."
				buttonText="Find your board"
				buttonHref="/surf-gear#guide-heading"
			/>

			<NewsletterPopup />
		</>
	);
}
