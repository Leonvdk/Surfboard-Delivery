import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaSection } from "../../components/cta-section";
import { JsonLd } from "../../components/json-ld";
import { HorizonLine, Reveal } from "../../components/reveal";
import { DELIVERY_TOWNS, allTownSlugs, getTownBySlug } from "../../lib/delivery-towns";
import { breadcrumbJsonLd, faqJsonLd } from "../../lib/jsonld";
import { SITE_URL } from "../../lib/metadata";

export function generateStaticParams() {
	return allTownSlugs().map((town) => ({ town }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ town: string }>;
}): Promise<Metadata> {
	const { town } = await params;
	const data = getTownBySlug(town);
	if (!data) return {};
	const url = `${SITE_URL}/deliver-to/${data.slug}`;
	return {
		title: data.title,
		description: data.metaDescription,
		alternates: { canonical: `/deliver-to/${data.slug}` },
		openGraph: {
			title: `${data.title} | Surf Rental Aljezur`,
			description: data.metaDescription,
			url,
		},
	};
}

export default async function DeliverToPage({
	params,
}: {
	params: Promise<{ town: string }>;
}) {
	const { town } = await params;
	const data = getTownBySlug(town);
	if (!data) return notFound();

	const url = `${SITE_URL}/deliver-to/${data.slug}`;
	const breadcrumbs = breadcrumbJsonLd([
		{ name: "Home", url: SITE_URL },
		{ name: "Delivery zones", url: `${SITE_URL}/deliver-to` },
		{ name: data.name, url },
	]);

	return (
		<>
			<JsonLd data={breadcrumbs} />
			<JsonLd data={faqJsonLd(data.faqs)} />

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<p className="section-label">{data.kicker}</p>
							<h1>{data.title}</h1>
							<p className="page-hero-sub">{data.oneLiner}</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="intro-heading">
				<div className="container">
					<Reveal>
						<div className="content-prose">
							<h2 id="intro-heading" className="sr-only">
								About delivery in {data.name}
							</h2>
							{data.introParagraphs.map((p, i) => (
								<p key={i}>{p}</p>
							))}
						</div>
					</Reveal>
				</div>
			</section>

			<section className="section section-alt" aria-labelledby="details-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">The details</p>
							<h2 className="section-title" id="details-heading">
								What delivery to {data.name} looks like
							</h2>
						</div>
					</Reveal>
					<Reveal stagger>
						<dl className="spot-detail-grid">
							<div className="spot-detail-item">
								<dt>Typical stays</dt>
								<dd>
									<ul style={{ paddingLeft: "1.1em", margin: 0 }}>
										{data.typicalStays.map((s) => (
											<li key={s}>{s}</li>
										))}
									</ul>
								</dd>
							</div>
							<div className="spot-detail-item">
								<dt>Nearby beaches</dt>
								<dd>
									<ul style={{ paddingLeft: "1.1em", margin: 0 }}>
										{data.nearbyBeaches.map((b) => (
											<li key={b.name}>
												<Link
													href={
														b.anchor
															? `/surf-spots#spot-${b.anchor}`
															: "/surf-spots"
													}
												>
													{b.name}
												</Link>{" "}
												— {b.distance}
											</li>
										))}
									</ul>
								</dd>
							</div>
							<div className="spot-detail-item">
								<dt>Delivery notes</dt>
								<dd>{data.deliveryNotes}</dd>
							</div>
							<div className="spot-detail-item">
								<dt>Board recommendation</dt>
								<dd>{data.boardMatch}</dd>
							</div>
						</dl>
					</Reveal>
				</div>
			</section>

			{data.personalNote && !data.personalNote.startsWith("TODO") && (
				<section className="section" aria-labelledby="note-heading">
					<div className="container">
						<Reveal>
							<div className="content-prose">
								<h2 id="note-heading" className="section-title">
									A note from Leon
								</h2>
								<p>{data.personalNote}</p>
							</div>
						</Reveal>
					</div>
				</section>
			)}

			<HorizonLine />

			<section className="section" aria-labelledby="faq-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Frequently asked</p>
							<h2 className="section-title" id="faq-heading">
								Delivery to {data.name} — questions
							</h2>
						</div>
					</Reveal>
					<Reveal>
						<dl className="home-faq-list">
							{data.faqs.map((faq) => (
								<div key={faq.question} className="home-faq-item">
									<dt className="home-faq-question">{faq.question}</dt>
									<dd className="home-faq-answer">{faq.answer}</dd>
								</div>
							))}
						</dl>
					</Reveal>
				</div>
			</section>

			<CtaSection
				heading={`Ready for delivery to ${data.name}?`}
				text="Tell us your dates and accommodation address — we reply within 24 hours in EN · NL · DE · FR · PT."
				buttonText="Request your board"
			/>
		</>
	);
}

export { DELIVERY_TOWNS };
