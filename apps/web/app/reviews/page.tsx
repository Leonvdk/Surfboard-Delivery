import type { Metadata } from "next";
import { CtaSection } from "../components/cta-section";
import { JsonLd } from "../components/json-ld";
import { HorizonLine, Reveal } from "../components/reveal";
import { StarRating } from "../components/star-rating";
import { reviewJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Reviews — What Surfers Say About SurfRental Aljezur",
	description:
		"Read genuine reviews from surfers who rented boards and wetsuits with SurfRental in Aljezur. 4.9 average rating from 200+ happy customers.",
	alternates: { canonical: "/reviews" },
	openGraph: {
		title: "Reviews | SurfRental Aljezur",
		description: "What surfers say about our surf gear delivery in Aljezur, Arrifana, and Vale da Telha.",
		url: `${SITE_URL}/reviews`,
	},
};

const reviews = [
	{
		author: "Hannah & Tom",
		country: "UK",
		type: "Couple",
		rating: 5,
		body: "Boards and wetsuits were waiting at our Airbnb when we arrived. The local tips alone were worth it — we found beaches we'd never have discovered on our own.",
	},
	{
		author: "Marc Dumont",
		country: "France",
		type: "Solo traveller",
		rating: 5,
		body: "I've rented boards all over Portugal and this is hands down the easiest experience. No shop queues, no deposit hassle. Just surf.",
	},
	{
		author: "Familie Schneider",
		country: "Germany",
		type: "Family of 4",
		rating: 5,
		body: "Renting boards for the whole family at a shop would have been a nightmare with two kids. Having everything delivered and set up was a game changer.",
	},
	{
		author: "Sara van Dijk",
		country: "Netherlands",
		type: "Solo traveller",
		rating: 5,
		body: "The wetsuit fit perfectly and the funboard was exactly right for my level. They really listen to what you need rather than just handing you whatever's available.",
	},
	{
		author: "James & Ali",
		country: "Ireland",
		type: "Couple",
		rating: 5,
		body: "We extended our stay by a week and they swapped our boards out for free. Incredibly flexible. We'll be back every year.",
	},
	{
		author: "Lucia Fernández",
		country: "Spain",
		type: "Group of friends",
		rating: 4,
		body: "Six of us, six boards, all different sizes. They sorted the whole quiver based on our levels and delivered everything in one trip. Made organising a group trip so much simpler.",
	},
	{
		author: "Patrick O'Brien",
		country: "UK",
		type: "Solo traveller",
		rating: 5,
		body: "First time surfing in Portugal. They set me up with a big foamie and told me exactly where to go for my first session. Caught waves within 20 minutes.",
	},
	{
		author: "Annika Holm",
		country: "Sweden",
		type: "Family of 3",
		rating: 5,
		body: "The delivery and pickup was so smooth we barely noticed it. Quality gear, great condition, and genuinely useful local advice. Can't fault it.",
	},
];

export default function ReviewsPage() {
	return (
		<>
			<JsonLd
				data={reviewJsonLd(
					reviews.map((r) => ({ author: r.author, rating: r.rating, body: r.body })),
				)}
			/>

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>Don&apos;t take our word for it</h1>
							<p className="page-hero-sub">
								Hear from surfers who&apos;ve rented with us in Aljezur, Arrifana, and Vale da Telha.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="stats-heading">
				<div className="container">
					<Reveal stagger>
						<div className="stats-grid">
							<div className="stat-card">
								<div className="stat-number">200+</div>
								<div className="stat-label">Happy surfers served</div>
							</div>
							<div className="stat-card">
								<div className="stat-number">4.9</div>
								<div className="stat-label">Average rating out of 5</div>
							</div>
							<div className="stat-card">
								<div className="stat-number">98%</div>
								<div className="stat-label">Would book again</div>
							</div>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section section-alt" aria-labelledby="reviews-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">What surfers say</p>
							<h2 className="section-title" id="reviews-heading">
								Real reviews from real trips
							</h2>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="reviews-grid">
							{reviews.map((review) => (
								<article key={review.author} className="review-card">
									<StarRating rating={review.rating} />
									<p className="review-quote">{review.body}</p>
									<div className="review-author">
										<span className="review-author-name">{review.author}</span>
										<span className="review-author-meta">
											{review.country} &middot; {review.type}
										</span>
									</div>
								</article>
							))}
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="collect-heading">
				<div className="container">
					<Reveal>
						<div className="content-prose" style={{ textAlign: "center" as const }}>
							<h2 className="section-title" id="collect-heading">
								How we collect reviews
							</h2>
							<p>
								After every rental, we send a follow-up email asking how things went. The reviews on
								this page come directly from those responses and from our Google Business listing. We
								never edit or cherry-pick — what you see is what surfers told us.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection />
		</>
	);
}
