export type PackageTier = "boardOnly" | "fullPackage" | "premium";
export type Duration = "daily" | "weekly" | "extended";

export interface PackageInfo {
	name: string;
	description: string;
	features: string[];
	whoIsItFor: string;
}

export interface PricePoint {
	amount: number;
	period: string;
	dailyEquivalent?: number;
}

export const DAILY_MINIMUM_DAYS = 3;

export const packages: Record<PackageTier, PackageInfo> = {
	boardOnly: {
		name: "Board Only",
		description: "Surfboard rental with leash, wax, and free delivery & pickup.",
		features: [
			"Surfboard of your choice",
			"Leash & wax included",
			"Free delivery & pickup",
		],
		whoIsItFor: "Already have a wetsuit",
	},
	fullPackage: {
		name: "Full Package",
		description:
			"Surfboard and wetsuit rental with leash, wax, and free delivery & pickup.",
		features: [
			"Surfboard of your choice",
			"Wetsuit (season-appropriate)",
			"Leash & wax included",
			"Free delivery & pickup",
			"Local surf spot tips",
		],
		whoIsItFor: "Most surfers",
	},
	premium: {
		name: "Premium Package",
		description:
			"Everything you need for a complete surf trip — plus mid-stay board swap so you can level up as you progress.",
		features: [
			"Mid-stay board swap — go up or down a size as your surfing changes",
			"Surfboard of your choice",
			"Wetsuit (season-appropriate)",
			"Leash & wax included",
			"Changing mat",
			"Roof rack pads",
			"Free delivery & pickup",
			"Local surf spot tips",
		],
		whoIsItFor: "Families & progressing surfers with a rental car",
	},
};

// Prices set 2026-07-19 after competitive research vs local Costa
// Vicentina rentals (Algarve Adventure, Arrifana Surf Lodge, FlynSurf,
// Lemontree, SUP Sagres). Daily rates undercut every published market
// number so short/casual stays are the cheapest in region; weekly
// caps are close to Arrifana Surf Lodge / Algarve Adventure and use
// our free-delivery-no-minimum story to justify the small premium
// over pure delivery competitors.
export const prices: Record<PackageTier, Record<Duration, PricePoint>> = {
	boardOnly: {
		daily: { amount: 18, period: "per day", dailyEquivalent: 18 },
		weekly: { amount: 100, period: "per week", dailyEquivalent: 12 },
		extended: { amount: 170, period: "2 weeks", dailyEquivalent: 11 },
	},
	fullPackage: {
		daily: { amount: 28, period: "per day", dailyEquivalent: 28 },
		weekly: { amount: 150, period: "per week", dailyEquivalent: 18 },
		extended: { amount: 250, period: "2 weeks", dailyEquivalent: 16 },
	},
	premium: {
		daily: { amount: 38, period: "per day", dailyEquivalent: 38 },
		weekly: { amount: 225, period: "per week", dailyEquivalent: 27 },
		extended: { amount: 380, period: "2 weeks", dailyEquivalent: 25 },
	},
};

export const groupDiscounts = {
	small: { label: "1\u20132 people", discount: 0 },
	medium: { label: "3\u20135 people", discount: 0.12 },
	large: { label: "6+ people", discount: null },
} as const;

export function getGroupPrice(tier: PackageTier, group: "small" | "medium"): number {
	const base = prices[tier].weekly.amount;
	const discount = groupDiscounts[group].discount;
	return Math.round(base * (1 - discount));
}

export function savingsPercent(dailyPrice: number, bundlePrice: number, days: number): number {
	const fullDaily = dailyPrice * days;
	return Math.round(((fullDaily - bundlePrice) / fullDaily) * 100);
}

export const TIERS: PackageTier[] = ["boardOnly", "fullPackage", "premium"];
export const FEATURED_TIER: PackageTier = "fullPackage";

export function calcPackagePrice(tier: PackageTier, days: number): number {
	const clamped = Math.max(DAILY_MINIMUM_DAYS, days);
	const dailyAmount = prices[tier].daily.amount;
	const weeklyAmount = prices[tier].weekly.amount;
	const extendedAmount = prices[tier].extended.amount;
	const weeklyDaily = prices[tier].weekly.dailyEquivalent ?? 0;
	const extendedDaily = prices[tier].extended.dailyEquivalent ?? 0;

	// Short stays prorate at the daily rate, but never charge more than the
	// full-week bundle — as soon as N × daily > weekly, the customer just gets
	// the weekly. (For board only that kicks in at day 6: 6×€18 = €108 > €100.)
	if (clamped <= 7) return Math.min(clamped * dailyAmount, weeklyAmount);
	// Second week: stack extra days at the weekly-daily rate, capped at the
	// 2-week bundle so the price never crosses the extended discount.
	if (clamped <= 14) {
		return Math.min(weeklyAmount + (clamped - 7) * weeklyDaily, extendedAmount);
	}
	// 15+ days: extended bundle plus additional days at the extended daily rate.
	return extendedAmount + (clamped - 14) * extendedDaily;
}

export function formatDurationLabel(days: number | null): string {
	if (days === null || days === 7) return "per week";
	if (days === 14) return "for 2 weeks";
	return `for ${days} days`;
}
