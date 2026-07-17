import { TrackedCtaLink } from "./tracked-cta-link";

interface Props {
	kicker?: string;
	headline?: string;
	cta?: string;
	href?: string;
	note?: string;
	location?: string;
}

export function InlineGearCta({
	kicker = "Planning a surf trip?",
	headline = "Get boards & wetsuits delivered to your Aljezur accommodation",
	cta = "Reserve your gear",
	href = "/contact?package=full",
	note = "Free delivery · Free cancellation up to 72h after booking",
	location = "blog_inline",
}: Props) {
	return (
		<aside className="blog-inline-cta" role="complementary">
			<p className="blog-inline-cta-kicker">{kicker}</p>
			<p className="blog-inline-cta-headline">{headline}</p>
			<TrackedCtaLink
				href={href}
				className="blog-inline-cta-btn"
				ctaText={cta}
				ctaLocation={location}
			>
				{cta}
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<line x1="5" y1="12" x2="19" y2="12" />
					<polyline points="12 5 19 12 12 19" />
				</svg>
			</TrackedCtaLink>
			<p className="blog-inline-cta-note">{note}</p>
		</aside>
	);
}
