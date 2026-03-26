import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "../components/cta-section";
import { HorizonLine, Reveal } from "../components/reveal";
import { SITE_URL } from "../lib/metadata";
import { prices } from "../lib/pricing";

export const metadata: Metadata = {
	title: "Surf Gift Vouchers Aljezur — Surfboard Rental Gift Cards",
	description:
		"Give the gift of waves. Buy a SurfRental gift voucher for surfboard and wetsuit rental in Aljezur. Perfect for birthdays, Christmas, and anniversaries.",
	alternates: { canonical: "/gift-vouchers" },
	openGraph: {
		title: "Gift Vouchers | SurfRental Aljezur",
		description:
			"Surf gift vouchers for board and wetsuit rental in Aljezur, Portugal. Digital delivery, valid for 12 months.",
		url: `${SITE_URL}/gift-vouchers`,
	},
};

export default function GiftVouchersPage() {
	return (
		<>
			<section className="page-hero">
				<div className="container">
					<Reveal>
						<div>
							<h1>Give the gift of waves</h1>
							<p className="page-hero-sub">
								A SurfRental voucher is a week of surf, delivered to their door. Perfect for someone
								planning a trip to the Algarve — or nudging them to book one.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="how-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">How it works</p>
							<h2 className="section-title" id="how-heading">
								Three simple steps
							</h2>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="steps-grid">
							<div className="step">
								<div className="step-number">01</div>
								<h3>Choose a voucher</h3>
								<p>
									Pick a package that matches — board only, full package, or extended stay. Or choose a
									custom amount.
								</p>
							</div>
							<div className="step">
								<div className="step-number">02</div>
								<h3>We send it</h3>
								<p>
									Receive a beautifully designed digital voucher by email, ready to forward or print.
									Usually within 24 hours.
								</p>
							</div>
							<div className="step">
								<div className="step-number">03</div>
								<h3>They book &amp; surf</h3>
								<p>
									The recipient contacts us with their dates. We handle everything from there — delivery,
									tips, pickup.
								</p>
							</div>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section section-alt" aria-labelledby="options-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Voucher options</p>
							<h2 className="section-title" id="options-heading">
								Pick a package
							</h2>
							<p className="section-desc">
								All vouchers are valid for 12 months and cover delivery and pickup.
							</p>
						</div>
					</Reveal>
					<Reveal stagger>
						<div className="voucher-grid voucher-grid-4">
							<div className="voucher-card">
								<div className="voucher-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<path d="M12 2v6M12 18v4M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M18 12h4M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" />
									</svg>
								</div>
								<h3>Board Only</h3>
								<div className="price">&euro;{prices.boardOnly.weekly.amount}</div>
								<p className="voucher-includes">
									Surfboard rental for 1 week with leash, wax, and free delivery &amp; pickup.
								</p>
								<Link href="/contact?subject=Gift+Voucher+Board+Only" className="btn btn-secondary btn-full">
									Order this voucher
								</Link>
							</div>
							<div className="voucher-card featured">
								<span className="pricing-badge">Most popular</span>
								<div className="voucher-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4" />
										<path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
										<path d="M18 12a2 2 0 000 4h4v-4h-4z" />
									</svg>
								</div>
								<h3>Full Package</h3>
								<div className="price">&euro;{prices.fullPackage.weekly.amount}</div>
								<p className="voucher-includes">
									Board + wetsuit for 1 week. Everything they need, nothing they don&apos;t.
								</p>
								<Link href="/contact?subject=Gift+Voucher+Full+Package" className="btn btn-primary btn-full">
									Order this voucher
								</Link>
							</div>
							<div className="voucher-card">
								<div className="voucher-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
										<path d="M9 22V12h6v10" />
									</svg>
								</div>
								<h3>Premium Package</h3>
								<div className="price">&euro;{prices.premium.weekly.amount}</div>
								<p className="voucher-includes">
									Board, wetsuit, changing mat &amp; roof rack pads for 1 week. The complete surf trip kit.
								</p>
								<Link href="/contact?subject=Gift+Voucher+Premium+Package" className="btn btn-secondary btn-full">
									Order this voucher
								</Link>
							</div>
							<div className="voucher-card">
								<div className="voucher-icon" aria-hidden="true">
									<svg viewBox="0 0 24 24">
										<rect x="3" y="4" width="18" height="18" rx="2" />
										<path d="M16 2v4M8 2v4M3 10h18" />
									</svg>
								</div>
								<h3>Extended Stay</h3>
								<div className="price">&euro;{prices.fullPackage.extended.amount}</div>
								<p className="voucher-includes">
									Full package for 2 weeks with mid-stay board swap. The ultimate gift for
									a proper surf holiday.
								</p>
								<Link href="/contact?subject=Gift+Voucher+Extended+Stay" className="btn btn-secondary btn-full">
									Order this voucher
								</Link>
							</div>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section" aria-labelledby="occasions-heading">
				<div className="container">
					<Reveal>
						<div className="section-header section-header-center">
							<p className="section-label">Perfect for</p>
							<h2 className="section-title" id="occasions-heading">
								Every occasion
							</h2>
						</div>
					</Reveal>
					<Reveal>
						<div className="occasion-grid">
							<span className="occasion-pill">
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4" />
									<path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
								</svg>
								Birthdays
							</span>
							<span className="occasion-pill">
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path d="M12 2l1.8 3.6L18 6.3l-3 2.9.7 4.1L12 11.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L12 2z" />
								</svg>
								Christmas
							</span>
							<span className="occasion-pill">
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
								</svg>
								Anniversaries
							</span>
							<span className="occasion-pill">
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
									<path d="M22 4L12 14.01l-3-3" />
								</svg>
								Graduation gifts
							</span>
							<span className="occasion-pill">
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
									<circle cx="9" cy="7" r="4" />
									<path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
								</svg>
								Corporate rewards
							</span>
							<span className="occasion-pill">
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<circle cx="12" cy="12" r="10" />
									<path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
								</svg>
								Just because
							</span>
						</div>
					</Reveal>
					<Reveal>
						<div className="content-prose" style={{ textAlign: "center" as const, marginTop: "var(--space-5)" }}>
							<p>
								Want a custom amount or a personalised message on the voucher? Just mention it in your
								order and we&apos;ll make it happen.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<CtaSection />
		</>
	);
}
