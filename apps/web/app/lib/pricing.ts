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
			"Everything you need for a complete surf trip — board, wetsuit, changing tub, and roof rack pads delivered to your door.",
		features: [
			"Surfboard of your choice",
			"Wetsuit (season-appropriate)",
			"Leash & wax included",
			"Changing tub",
			"Roof rack pads",
			"Free delivery & pickup",
			"Local surf spot tips",
		],
		whoIsItFor: "Families with a rental car",
	},
};

export const prices: Record<PackageTier, Record<Duration, PricePoint>> = {
	boardOnly: {
		daily: { amount: 25, period: "per day", dailyEquivalent: 25 },
		weekly: { amount: 85, period: "per week", dailyEquivalent: 12 },
		extended: { amount: 145, period: "2 weeks", dailyEquivalent: 10 },
	},
	fullPackage: {
		daily: { amount: 35, period: "per day", dailyEquivalent: 35 },
		weekly: { amount: 120, period: "per week", dailyEquivalent: 17 },
		extended: { amount: 199, period: "2 weeks", dailyEquivalent: 14 },
	},
	premium: {
		daily: { amount: 45, period: "per day", dailyEquivalent: 45 },
		weekly: { amount: 150, period: "per week", dailyEquivalent: 21 },
		extended: { amount: 249, period: "2 weeks", dailyEquivalent: 18 },
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
