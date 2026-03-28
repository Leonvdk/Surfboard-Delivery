import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "../components/cta-section";
import { JsonLd } from "../components/json-ld";
import { HorizonLine, Reveal } from "../components/reveal";
import { faqJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Frequently Asked Questions — Surf Gear Rental Aljezur",
	description:
		"Answers to common questions about surfboard and wetsuit rental in Aljezur. Minimum rental period, delivery area, what's included, payment, and cancellation policy.",
	alternates: { canonical: "/faq" },
	openGraph: {
		title: "FAQ | Surf Rental Aljezur",
		description:
			"Everything you need to know about renting surf gear with delivery in Aljezur, Arrifana, and Vale da Telha.",
		url: `${SITE_URL}/faq`,
	},
};

const faqs = [
	{
		question: "What is the minimum rental period?",
		answer:
			"We have a one-week minimum rental. This allows us to offer competitive prices and provide a personal delivery service. For shorter stays, we recommend the surf huts at Arrifana beach for daily rentals.",
	},
	{
		question: "Where do you deliver?",
		answer:
			"We deliver for free to all accommodations in Aljezur, Arrifana, Vale da Telha, and Monte Clérigo. If you're staying nearby but outside these areas, get in touch — we may still be able to deliver.",
	},
	{
		question: "How far in advance should I book?",
		answer:
			"We recommend booking at least a week before your trip, especially during peak summer months (July–August). During shoulder and off-season, a few days' notice is usually fine. We confirm all bookings within 24 hours.",
	},
	{
		question: "What surfboards do you have?",
		answer:
			"We carry soft tops (7'0–8'0) for beginners, epoxy funboards (6'6–7'6) for intermediates, and performance shortboards (5'8–6'4) for advanced surfers. Not sure what to choose? Tell us your level and we'll recommend the right board.",
	},
	{
		question: "What wetsuit thickness will I need?",
		answer:
			"It depends on the season. Summer (June–September): 3/2mm. Shoulder season (April–May, October): 4/3mm. Winter (November–March): 4/3mm or 5/3mm. We always provide the appropriate thickness for your dates — no need to think about it.",
	},
	{
		question: "What's included in the rental?",
		answer:
			"Every rental includes the board, leash, and wax. The Full Package and Extended Stay plans also include a wetsuit. We deliver everything to your door and pick it up before your checkout.",
	},
	{
		question: "Can I swap my board during my rental?",
		answer:
			"The Extended Stay (2-week) package includes one free board swap. For one-week rentals, swaps are possible for a small fee depending on availability — just ask.",
	},
	{
		question: "What if I damage the board?",
		answer:
			"Normal wear and tear (small dings, wax marks) is expected and covered. For significant damage, we'll assess on a case-by-case basis. We don't charge a deposit upfront — we trust our renters to take reasonable care of the gear.",
	},
	{
		question: "How do I pay?",
		answer:
			"We accept MBWay, bank transfer, and cash. Payment is due on delivery. No deposit required.",
	},
	{
		question: "What's your cancellation policy?",
		answer:
			"Cancel up to 48 hours before your check-in date for a full refund. Cancellations within 48 hours are charged at 50%. No-shows are charged in full.",
	},
	{
		question: "Do you offer surf lessons?",
		answer:
			"We focus on gear rental and delivery. For surf lessons, we recommend Aljezur Surf School or Arrifana Surf School — both have excellent instructors and operate on the local beaches. We can help you get in touch with them.",
	},
	{
		question: "I'm a complete beginner. Can I still rent from you?",
		answer:
			"Absolutely. We'll set you up with a large, stable soft top board and a wetsuit. We also share beginner-friendly spot recommendations and basic tips on delivery day. If you want structured lessons, we recommend combining our rental with a few sessions at a local surf school.",
	},
];

export default function FaqPage() {
	return (
		<>
			<JsonLd data={faqJsonLd(faqs)} />

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>Frequently asked questions</h1>
							<p className="page-hero-sub">
								Everything you need to know about renting surf gear with us. Can&apos;t find your
								answer? <Link href="/contact">Get in touch</Link>.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="faq-heading">
				<div className="container">
					<h2 id="faq-heading" className="sr-only">
						Questions and answers
					</h2>
					<Reveal stagger>
						<div className="faq-list">
							{faqs.map((faq) => (
								<details key={faq.question} className="faq-item">
									<summary className="faq-question">{faq.question}</summary>
									<div className="faq-answer">
										<p>{faq.answer}</p>
									</div>
								</details>
							))}
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection
				heading="Still have questions?"
				text="Drop us a message. We respond to every inquiry within 24 hours."
				buttonText="Contact us"
			/>
		</>
	);
}
