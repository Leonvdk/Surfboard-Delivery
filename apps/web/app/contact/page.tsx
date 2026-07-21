import type { Metadata } from "next";
import { BookingForm } from "../components/booking-form";
import { OwnerVouch } from "../components/owner-vouch";
import { HorizonLine, Reveal } from "../components/reveal";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Contact & Book Your Surf Gear Rental",
	description:
		"Get in touch to reserve surfboards and wetsuits for your trip to Aljezur. Send us your dates and accommodation — we'll confirm within 24 hours. Email, WhatsApp, or contact form.",
	alternates: { canonical: "/contact" },
	openGraph: {
		title: "Contact & Book | Surf Rental Aljezur",
		description:
			"Reserve surfboards and wetsuits for your stay in Aljezur. We respond within 24 hours.",
		url: `${SITE_URL}/contact`,
	},
};

export default function ContactPage() {
	return (
		<>
			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>Book surf rental delivery in Aljezur — reply usually within 3h</h1>
							<p className="page-hero-sub">
								Tell us your dates, accommodation address, height, weight,
								and experience level. Leon reads every request personally
								and replies within a few hours (08:00–20:00 Portugal, GMT+1)
								in EN · NL · DE · FR · PT with a board-and-wetsuit match,
								total price, and delivery confirmation. Pay on arrival or
								by card — no deposit, cancel free within 72 hours.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="contact-heading">
				<div className="container">
					{/* No Reveal around the form — the h1 already fills the mobile
						viewport, so the form has to be visible immediately or
						visitors think the page is empty and bounce. */}
					<div className="contact-layout">
						<div>
							<h2 id="contact-heading" className="sr-only">
								Contact form
							</h2>
							<OwnerVouch />
							<BookingForm />
						</div>

						<Reveal stagger>
							<aside className="contact-sidebar">
								<div className="contact-card">
									<h3>Prefer email or WhatsApp?</h3>
									<p>No problem — reach us directly:</p>
									<dl className="contact-details">
										<dt>Email</dt>
										<dd>
											<a href="mailto:hello@surfrental-aljezur.com">
												hello@surfrental-aljezur.com
											</a>
										</dd>
										<dt>Phone / WhatsApp</dt>
										<dd>
											<a
												href="https://wa.me/31613262259"
												target="_blank"
												rel="noopener noreferrer"
											>
												+31 6 13262259
											</a>
										</dd>
									</dl>
								</div>
								<div className="contact-card">
									<h3>What to include</h3>
									<ul>
										<li>Check-in &amp; checkout dates</li>
										<li>Accommodation address</li>
										<li>Number of people</li>
										<li>Experience level(s)</li>
										<li>Any board preferences</li>
									</ul>
								</div>
								<div className="contact-card">
									<h3>Why no instant checkout?</h3>
									<p>
										We don&apos;t do instant booking and payment on purpose.
										We personally review every request to make sure you get
										the right gear for your level and conditions — so you
										pay only once everything is confirmed and matched.
									</p>
								</div>
								<div className="contact-card">
									<h3>Delivery area</h3>
									<p>
										Free delivery to Aljezur, Arrifana, Vale da Telha, and
										Monte Clérigo. Staying nearby?{" "}
										<a href="mailto:hello@surfrental-aljezur.com">Ask us</a>.
									</p>
								</div>
								<p className="contact-since">
									Operating on the Costa Vicentina since September 2025.
								</p>
							</aside>
						</Reveal>
					</div>
				</div>
			</section>
		</>
	);
}
