import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../components/json-ld";
import { HorizonLine, Reveal } from "../components/reveal";
import { breadcrumbJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Privacy Policy",
	description:
		"How SurfRental Aljezur collects, uses, and protects your personal data. GDPR-compliant privacy policy.",
	alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
	return (
		<>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", url: SITE_URL },
					{ name: "Privacy Policy", url: `${SITE_URL}/privacy` },
				])}
			/>

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>Privacy policy</h1>
							<p className="page-hero-sub">
								How we handle your personal data. Short version: we collect only what we need, we
								don&apos;t sell it, and you can ask us to delete it anytime.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section">
				<div className="container">
					<Reveal>
						<div className="legal-prose">
							<h2>1. Who we are</h2>
							<p>
								SurfRental Aljezur is a surf equipment rental service based in Aljezur, Faro district,
								Portugal. We are the data controller for the personal information described in this
								policy.
							</p>
							<p>
								<strong>Contact:</strong>{" "}
								<a href="mailto:hello@surfrental.pt">hello@surfrental.pt</a>
							</p>

							<h2>2. What data we collect</h2>
							<p>When you contact us to book a rental, we collect:</p>
							<ul>
								<li>
									<strong>Name</strong> — to identify your booking and greet you on delivery
								</li>
								<li>
									<strong>Email address</strong> — to confirm your booking and send follow-up
									communications
								</li>
								<li>
									<strong>Phone number</strong> (optional) — to coordinate delivery timing via
									WhatsApp or SMS
								</li>
								<li>
									<strong>Accommodation address</strong> — to deliver and pick up your gear
								</li>
								<li>
									<strong>Booking dates</strong> — to manage our inventory and schedule deliveries
								</li>
								<li>
									<strong>Surfing experience level</strong> — to recommend appropriate gear
								</li>
							</ul>
							<p>
								We do not collect payment card details. Payments are handled in person (cash) or via
								MBWay / bank transfer through your own banking provider.
							</p>

							<h2>3. Why we collect it</h2>
							<p>We use your data for the following purposes:</p>
							<ul>
								<li>
									<strong>Service delivery:</strong> To fulfil your rental booking — delivering the
									right gear to the right place at the right time.
								</li>
								<li>
									<strong>Communication:</strong> To confirm bookings, coordinate delivery/pickup, and
									answer your questions.
								</li>
								<li>
									<strong>Follow-up:</strong> To send a one-time post-rental email asking for feedback.
									You can opt out of this at any time.
								</li>
							</ul>
							<p>
								We do not use your data for marketing, profiling, or automated decision-making unless
								you explicitly opt in to receive updates from us.
							</p>

							<h2>4. Legal basis</h2>
							<p>
								Under the General Data Protection Regulation (GDPR), we process your data on the
								following legal bases:
							</p>
							<ul>
								<li>
									<strong>Contractual necessity:</strong> Processing is necessary to fulfil the rental
									service you requested (Article 6(1)(b)).
								</li>
								<li>
									<strong>Legitimate interest:</strong> Post-rental feedback requests are based on our
									legitimate interest in improving our service (Article 6(1)(f)).
								</li>
								<li>
									<strong>Consent:</strong> Any marketing communications beyond a one-time follow-up
									are sent only with your explicit consent (Article 6(1)(a)).
								</li>
							</ul>

							<h2>5. How we store your data</h2>
							<p>
								Your data is stored securely in EU-based services. We do not transfer data outside the
								European Economic Area.
							</p>
							<p>
								We retain booking data for <strong>24 months</strong> after your last rental to handle
								repeat bookings and any outstanding queries. After this period, data is securely deleted
								unless you have an active booking or have requested otherwise.
							</p>

							<h2>6. Your rights</h2>
							<p>Under GDPR, you have the right to:</p>
							<ul>
								<li>
									<strong>Access</strong> — Request a copy of the personal data we hold about you.
								</li>
								<li>
									<strong>Rectification</strong> — Ask us to correct any inaccurate data.
								</li>
								<li>
									<strong>Erasure</strong> — Ask us to delete your data (&quot;right to be
									forgotten&quot;).
								</li>
								<li>
									<strong>Restriction</strong> — Ask us to limit how we use your data.
								</li>
								<li>
									<strong>Portability</strong> — Receive your data in a structured, machine-readable
									format.
								</li>
								<li>
									<strong>Object</strong> — Object to processing based on legitimate interest.
								</li>
							</ul>
							<p>
								To exercise any of these rights, email us at{" "}
								<a href="mailto:hello@surfrental.pt">hello@surfrental.pt</a>. We respond to all
								requests within 30 days.
							</p>

							<h2>7. Cookies</h2>
							<p>
								This website uses minimal cookies. We do not use advertising or third-party tracking
								cookies.
							</p>
							<ul>
								<li>
									<strong>Essential cookies:</strong> Required for the website to function (e.g.,
									session handling). These cannot be disabled.
								</li>
								<li>
									<strong>Analytics:</strong> We may use privacy-respecting analytics to understand how
									visitors use our site. No personal data is collected, and no data is shared with third
									parties.
								</li>
							</ul>

							<h2>8. Third parties</h2>
							<p>
								We do not sell, rent, or share your personal data with third parties for their
								marketing purposes. The only third parties with potential access to your data are:
							</p>
							<ul>
								<li>
									<strong>Hosting provider:</strong> Our website is hosted on EU-based infrastructure.
								</li>
								<li>
									<strong>Email provider:</strong> Used solely to send booking confirmations and
									follow-ups.
								</li>
							</ul>

							<h2>9. Changes to this policy</h2>
							<p>
								We may update this privacy policy from time to time. Changes will be posted on this
								page with an updated date. We encourage you to review this page periodically.
							</p>

							<h2>10. Contact &amp; complaints</h2>
							<p>
								If you have questions about this policy or wish to make a complaint, contact us at{" "}
								<a href="mailto:hello@surfrental.pt">hello@surfrental.pt</a>.
							</p>
							<p>
								You also have the right to lodge a complaint with the Portuguese data protection
								authority, the <strong>Comissão Nacional de Proteção de Dados (CNPD)</strong>, at{" "}
								<a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">
									www.cnpd.pt
								</a>.
							</p>

							<p className="legal-updated">Last updated: March 2026</p>
						</div>
					</Reveal>
				</div>
			</section>
		</>
	);
}
