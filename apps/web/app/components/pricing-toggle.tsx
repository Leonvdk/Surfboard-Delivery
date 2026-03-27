"use client";

import { useState } from "react";
import { CheckIcon } from "./check-icon";
import { TrackedCtaLink } from "./tracked-cta-link";
import {
	type Duration,
	type PackageTier,
	DAILY_MINIMUM_DAYS,
	FEATURED_TIER,
	TIERS,
	packages,
	prices,
	savingsPercent,
} from "../lib/pricing";

export function PricingToggle() {
	const [duration, setDuration] = useState<"daily" | "weekly">("weekly");

	return (
		<>
			<div className="pricing-duration-toggle">
				<button
					type="button"
					className={`toggle-btn ${duration === "daily" ? "active" : ""}`}
					onClick={() => setDuration("daily")}
					aria-pressed={duration === "daily"}
				>
					Daily
				</button>
				<button
					type="button"
					className={`toggle-btn ${duration === "weekly" ? "active" : ""}`}
					onClick={() => setDuration("weekly")}
					aria-pressed={duration === "weekly"}
				>
					Weekly
					<span className="toggle-save-badge">Best value</span>
				</button>
			</div>
			{duration === "daily" && (
				<p className="pricing-min-note">
					Minimum rental: {DAILY_MINIMUM_DAYS} days
				</p>
			)}
			<div className="pricing-grid">
				{TIERS.map((tier) => (
					<PricingCard
						key={tier}
						tier={tier}
						duration={duration}
						featured={tier === FEATURED_TIER}
					/>
				))}
			</div>
		</>
	);
}

function PricingCard({
	tier,
	duration,
	featured,
}: {
	tier: PackageTier;
	duration: "daily" | "weekly";
	featured: boolean;
}) {
	const pkg = packages[tier];
	const price = prices[tier][duration];
	const dailyPrice = prices[tier].daily.amount;
	const saving =
		duration === "weekly"
			? savingsPercent(dailyPrice, price.amount, 7)
			: 0;

	return (
		<div className={`pricing-card ${featured ? "featured" : ""}`}>
			{featured && <span className="pricing-badge">Most popular</span>}
			<h3>{pkg.name}</h3>
			<div className="pricing-card-price-block">
				{duration === "weekly" && (
					<div className="price-was">
						&euro;{dailyPrice * 7}
					</div>
				)}
				<div className="price">&euro;{price.amount}</div>
				<div className="price-period">{price.period}</div>
				{saving > 0 && (
					<span className="price-save-badge">Save {saving}%</span>
				)}
			</div>
			<p className="pricing-who">{pkg.whoIsItFor}</p>
			<div className="pricing-divider" />
			<ul>
				{pkg.features.map((f) => (
					<li key={f}>
						<CheckIcon /> {f}
					</li>
				))}
			</ul>
			<TrackedCtaLink
				href={`/contact?package=${encodeURIComponent(pkg.name)}`}
				className={`btn ${featured ? "btn-primary" : "btn-secondary"} btn-full`}
				ctaText={`Book ${pkg.name}`}
				ctaLocation="pricing_card"
			>
				Book {pkg.name}
			</TrackedCtaLink>
		</div>
	);
}
