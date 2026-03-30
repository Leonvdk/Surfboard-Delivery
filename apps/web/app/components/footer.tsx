import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";

export function Footer() {
	return (
		<footer className="footer">
			<div className="container">
				<div className="footer-grid">
					<div>
						<div className="footer-brand">
							Surf Rental <em>Aljezur</em>
						</div>
						<p className="footer-tagline">
							Premium surf board rentals across Europe&apos;s best beaches.
						</p>
					</div>
					<div>
						<div className="footer-col-title">Explore</div>
						<ul className="footer-links">
							<li><Link href="/surf-gear">Boards</Link></li>
							<li><Link href="/pricing">Pricing</Link></li>
							<li><Link href="/how-it-works">Process</Link></li>
							<li><Link href="/surf-spots">Locations</Link></li>
							<li><Link href="/faq">FAQ</Link></li>
						</ul>
					</div>
					<div>
						<div className="footer-col-title">Company</div>
						<ul className="footer-links">
							<li><Link href="/about">About</Link></li>
							<li><Link href="/blog">Blog</Link></li>
							<li><Link href="/reviews">Reviews</Link></li>
							<li><Link href="/contact">Contact</Link></li>
						</ul>
					</div>
					<div>
						<div className="footer-col-title">Legal</div>
						<ul className="footer-links">
							<li><Link href="/terms">Terms</Link></li>
							<li><Link href="/privacy">Privacy</Link></li>
						</ul>
					</div>
				</div>
				<div className="footer-newsletter">
					<div className="footer-newsletter-inner">
						<div className="footer-newsletter-text">
							<p className="footer-newsletter-title">Stay in the lineup</p>
							<p className="footer-newsletter-desc">
								Surf conditions, local tips &amp; exclusive deals — straight to your inbox.
							</p>
						</div>
						<NewsletterForm />
					</div>
				</div>
				<div className="footer-bottom">
					<div>&copy; {new Date().getFullYear()} Surf Rental Aljezur</div>
				</div>
			</div>
		</footer>
	);
}
