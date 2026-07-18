import type { Booking, BookingStatus } from "../../lib/db/schema";

function nights(b: Booking): number {
	const a = new Date(`${b.checkin}T00:00:00Z`).getTime();
	const c = new Date(`${b.checkout}T00:00:00Z`).getTime();
	return Math.max(1, Math.round((c - a) / 86400000));
}

export interface FunnelSummary {
	label: string;
	requested: number;
	confirmed: number;
	completed: number;
	cancelled: number;
	confirmRate: number | null; // (confirmed + completed) / requested-or-more
}

function periodLabel(y: number, m: number): string {
	return new Date(Date.UTC(y, m, 1)).toLocaleDateString("en-GB", {
		month: "short",
		year: "2-digit",
		timeZone: "UTC",
	});
}

function isInPeriod(iso: string, y: number, m: number): boolean {
	return iso.startsWith(`${y}-${String(m + 1).padStart(2, "0")}`);
}

/**
 * Booking funnel counts by created month. Compares the current month to the
 * previous month so Leon can see the trend at a glance.
 */
export function bookingFunnelForRecentMonths(
	bookings: Booking[],
): { current: FunnelSummary; previous: FunnelSummary } {
	const now = new Date();
	const currentY = now.getUTCFullYear();
	const currentM = now.getUTCMonth();
	const prev = new Date(Date.UTC(currentY, currentM - 1, 1));
	const prevY = prev.getUTCFullYear();
	const prevM = prev.getUTCMonth();

	function build(y: number, m: number, label: string): FunnelSummary {
		const inPeriod = bookings.filter((b) =>
			isInPeriod(b.createdAt.toISOString().slice(0, 10), y, m),
		);
		const by = (s: BookingStatus) =>
			inPeriod.filter((b) => b.status === s).length;
		const requested = inPeriod.length;
		const confirmed = by("confirmed");
		const completed = by("completed");
		const cancelled = by("cancelled");
		const producing = confirmed + completed + by("in_progress");
		const rate = requested > 0 ? producing / requested : null;
		return { label, requested, confirmed, completed, cancelled, confirmRate: rate };
	}

	return {
		current: build(currentY, currentM, periodLabel(currentY, currentM)),
		previous: build(prevY, prevM, periodLabel(prevY, prevM)),
	};
}

export interface PackageMixEntry {
	key: string;
	label: string;
	count: number;
	pct: number;
}

const PACKAGE_ORDER = ["board", "full", "premium", "custom"] as const;
const PACKAGE_LABEL: Record<string, string> = {
	board: "Board only",
	full: "Full",
	premium: "Premium",
	custom: "Undecided",
};

function normalisePackage(v: string | undefined): string {
	if (!v) return "custom";
	return v.replace(/-\d+w$/, "");
}

/**
 * Package mix across every person in every non-cancelled booking whose
 * check-in falls in the last `days` days.
 */
export function packageMix(bookings: Booking[], days: number): PackageMixEntry[] {
	const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
	const counts = new Map<string, number>();
	for (const b of bookings) {
		if (b.status === "cancelled") continue;
		if (b.checkin < cutoff) continue;
		if (!b.people) continue;
		for (const p of b.people) {
			const key = normalisePackage(p.package);
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
	}
	const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
	if (total === 0) return [];
	return PACKAGE_ORDER.filter((k) => counts.has(k))
		.map((k) => ({
			key: k,
			label: PACKAGE_LABEL[k] ?? k,
			count: counts.get(k) ?? 0,
			pct: ((counts.get(k) ?? 0) / total) * 100,
		}))
		.sort((a, b) => b.count - a.count);
}

export interface MonthlyRollupRow {
	month: string; // YYYY-MM
	label: string;
	bookings: number;
	gearNights: number; // people × nights across confirmed+
	avgPartySize: number;
	avgTripNights: number;
	estimateTotal: number;
	finalTotal: number;
}

const PRODUCING: BookingStatus[] = ["confirmed", "in_progress", "completed"];

/**
 * Group producing bookings by check-in month and compute the row.
 * `months` argument caps how many rows to return (default 12).
 */
export function monthlyRollup(
	bookings: Booking[],
	months: number = 12,
): MonthlyRollupRow[] {
	const groups = new Map<string, Booking[]>();
	for (const b of bookings) {
		if (!PRODUCING.includes(b.status)) continue;
		const monthKey = b.checkin.slice(0, 7);
		const arr = groups.get(monthKey) ?? [];
		arr.push(b);
		groups.set(monthKey, arr);
	}
	const rows: MonthlyRollupRow[] = Array.from(groups.entries()).map(
		([month, bs]) => {
			const [ys, ms] = month.split("-");
			const y = Number.parseInt(ys!, 10);
			const m = Number.parseInt(ms!, 10) - 1;
			const label = new Date(Date.UTC(y, m, 1)).toLocaleDateString("en-GB", {
				month: "short",
				year: "2-digit",
				timeZone: "UTC",
			});
			const gearNights = bs.reduce(
				(sum, b) => sum + b.peopleCount * nights(b),
				0,
			);
			const totalPeople = bs.reduce((sum, b) => sum + b.peopleCount, 0);
			const totalNights = bs.reduce((sum, b) => sum + nights(b), 0);
			const estimateTotal = bs.reduce(
				(sum, b) => sum + (b.estimatedTotal ?? 0),
				0,
			);
			const finalTotal = bs.reduce((sum, b) => sum + (b.finalTotal ?? 0), 0);
			return {
				month,
				label,
				bookings: bs.length,
				gearNights,
				avgPartySize: totalPeople / bs.length,
				avgTripNights: totalNights / bs.length,
				estimateTotal,
				finalTotal,
			};
		},
	);
	rows.sort((a, b) => (a.month < b.month ? 1 : -1));
	return rows.slice(0, months);
}
