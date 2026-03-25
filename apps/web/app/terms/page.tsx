import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../components/json-ld";
import { HorizonLine, Reveal } from "../components/reveal";
import { breadcrumbJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Terms & Conditions",
	description:
		"Terms and conditions for SurfRental Aljezur surf gear rental, including booking, cancellation, damage, and delivery policies.",
	alternates: { canonical: "/terms" },
};

export default function TermsPage() {
	return (
		<>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", url: SITE_URL },
					{ name: "Terms & Conditions", url: `${SITE_URL}/terms` },
				])}
			/>

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>Terms &amp; conditions</h1>
							<p className="page-hero-sub">
								The practical details of renting with us. We keep things fair and simple.
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
							<h2>1. Booking &amp; confirmation</h2>
							<p>
								All bookings are made via our <Link href="/contact">contact form</Link>, email
								(hello@surfrental.pt), or WhatsApp. A booking is confirmed once we reply with
								availability and you agree to proceed. No payment is taken until delivery.
							</p>
							<p>
								We aim to confirm all bookings within 24 hours. During peak season (June–September),
								we recommend booking at least one week in advance.
							</p>

							<h2>2. Rental period &amp; returns</h2>
							<p>
								Our standard rental period is <strong>one week</strong> (7 days). Extended rentals
								of two weeks are available at a discounted rate. The rental period begins on the
								day of delivery and ends on the day of pickup.
							</p>
							<p>
								Gear must be available for pickup at your accommodation on the agreed date. If you
								need to change your pickup date, please let us know at least 24 hours in advance.
							</p>

							<h2>3. Delivery &amp; pickup</h2>
							<p>
								We deliver to accommodations in <strong>Aljezur, Arrifana, Vale da Telha, and
								Monte Clérigo</strong> at no additional charge. Deliveries to nearby areas may be
								possible — <Link href="/contact">ask us</Link>.
							</p>
							<p>
								Delivery is arranged for your check-in day at a mutually agreed time. Pickup is
								arranged for your last day or the day before checkout. We&apos;ll coordinate exact
								times by message.
							</p>

							<h2>4. Payment terms</h2>
							<p>
								Payment is due on delivery. We accept <strong>cash (EUR)</strong>, <strong>MBWay</strong>,
								and <strong>bank transfer</strong>. For bank transfers, payment must clear before
								or on the day of delivery.
							</p>
							<p>
								All prices are in euros and include delivery and pickup. Current pricing is listed
								on our <Link href="/surf-gear">gear page</Link>.
							</p>

							<h2>5. Cancellation &amp; refunds</h2>
							<ul>
								<li>
									<strong>48+ hours before delivery:</strong> Free cancellation, no charge.
								</li>
								<li>
									<strong>24–48 hours before delivery:</strong> 50% of the rental fee applies.
								</li>
								<li>
									<strong>Less than 24 hours / no-show:</strong> Full rental fee applies.
								</li>
							</ul>
							<p>
								If you need to shorten your rental after delivery, we can arrange early pickup but
								no partial refund applies for the remaining days.
							</p>

							<h2>6. Damage &amp; loss</h2>
							<p>
								Normal wear and tear is expected — minor wax marks, small surface scratches, and
								general use marks are not charged. We inspect all gear before and after every rental.
							</p>
							<p>
								<strong>Significant damage</strong> (major dings, snapped fins, torn wetsuits, broken
								leashes through misuse) will be assessed and charged at repair cost. If a board is
								damaged beyond repair or lost, the replacement cost will apply.
							</p>
							<p>
								We encourage honest communication. Accidents happen in surf — let us know and
								we&apos;ll keep it fair.
							</p>

							<h2>7. Liability &amp; insurance</h2>
							<p>
								Surfing involves inherent risks. By renting from SurfRental, you acknowledge that
								you surf at your own risk. We are not liable for injuries, accidents, or losses that
								occur while using our equipment.
							</p>
							<p>
								We recommend that all renters have personal travel insurance that covers water sports.
								We do not provide personal injury insurance.
							</p>

							<h2>8. Age requirements</h2>
							<p>
								Renters must be at least 18 years old to enter into a rental agreement. Minors may use
								rental equipment under the supervision and responsibility of a parent or legal guardian
								who accepts these terms.
							</p>

							<h2>9. Gear care</h2>
							<p>
								Please rinse boards and wetsuits with fresh water after use and store them in a
								shaded area. Do not leave boards in direct sunlight for extended periods, as heat
								can cause delamination. Wetsuits should be hung to dry (not on a wire hanger).
							</p>

							<h2>10. Governing law</h2>
							<p>
								These terms are governed by the laws of Portugal. Any disputes will be subject to
								the jurisdiction of the courts of Faro, Portugal.
							</p>

							<p className="legal-updated">Last updated: March 2026</p>
						</div>
					</Reveal>
				</div>
			</section>
		</>
	);
}
