import Image from "next/image";
import Link from "next/link";

export function Footer() {
	return (
		<footer className="footer">
			<div className="container">
				<div className="footer-grid">
					<div>
						<div className="footer-brand">
							<Image src="/images/logo.png" alt="" width={32} height={32} className="footer-logo-img" />
							<span>Surf Rental <em>Aljezur</em></span>
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
				<div className="footer-bottom">
					<div>&copy; {new Date().getFullYear()} Surf Rental Aljezur</div>
					<div className="footer-socials">
						<a href="#" aria-label="Instagram">
							<svg viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
								<rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
								<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
								<line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
							</svg>
						</a>
						<a href="#" aria-label="Twitter / X">
							<svg viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
								<path d="M4 4l11.733 16h4.267l-11.733 -16h-4.267z" />
								<path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
							</svg>
						</a>
						<a href="#" aria-label="YouTube">
							<svg viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
								<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
								<polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
							</svg>
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
