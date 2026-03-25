import Link from "next/link";
import { Reveal } from "./reveal";

interface CtaSectionProps {
	heading?: string;
	text?: string;
	buttonText?: string;
	buttonHref?: string;
}

export function CtaSection({
	heading = "Ready to paddle out?",
	text = "Book your board in thirty seconds. Flexible cancellation, premium gear, zero stress.",
	buttonText = "Reserve your board",
	buttonHref = "/contact",
}: CtaSectionProps) {
	return (
		<section className="cta" id="book">
			<div className="container">
				<Reveal>
					<div className="cta-inner">
						<h2 className="cta-title">{heading}</h2>
						<p className="cta-desc">{text}</p>
						<Link href={buttonHref} className="btn-accent">
							{buttonText}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<line x1="5" y1="12" x2="19" y2="12" />
								<polyline points="12 5 19 12 12 19" />
							</svg>
						</Link>
						<p className="cta-note">Free cancellation up to 24 hours before pickup</p>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
