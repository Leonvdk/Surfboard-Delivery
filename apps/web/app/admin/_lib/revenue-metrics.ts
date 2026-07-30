import type { Booking } from "../../lib/db/schema";

/**
 * Money maths for the Revenue page, kept pure and unit-tested so the P&L is
 * provably right. All amounts are in CENTS — bookings store whole euros, so
 * we lift them to cents here and never mix units downstream.
 *
 * Revenue is recognised on `checkout` (the service is delivered when the
 * gear comes back) for "producing" bookings — confirmed, in progress, or
 * completed. Requests and cancellations don't count. Payment is a separate
 * axis: a booking can be billed but not yet collected.
 */

export type Producing = "confirmed" | "in_progress" | "completed";
const PRODUCING = new Set<string>(["confirmed", "in_progress", "completed"]);

/** Whole-euro booking amount → cents. finalTotal wins; estimate is the
 * fallback for older/imported bookings that were never finalised. */
export function billedCents(b: Booking): number {
	const euros = b.finalTotal ?? b.estimatedTotal ?? 0;
	return Math.round(euros * 100);
}

function nights(b: Booking): number {
	const a = new Date(`${b.checkin}T00:00:00Z`).getTime();
	const c = new Date(`${b.checkout}T00:00:00Z`).getTime();
	if (Number.isNaN(a) || Number.isNaN(c)) return 0;
	return Math.max(1, Math.round((c - a) / 86_400_000) + 1);
}

/** ISO date (YYYY-MM-DD) within [startIso, endIso]. startIso null = open
 * start (all-time). endIso is inclusive. */
function inWindow(dateIso: string, startIso: string | null, endIso: string): boolean {
	if (!dateIso) return false;
	if (startIso && dateIso < startIso) return false;
	return dateIso <= endIso;
}

/** A single ledger payment, as much as the metrics need. */
export interface PaymentRow {
	bookingId: number;
	amountCents: number;
	method: string;
	createdAt: Date;
}

export interface RevenueMetrics {
	/** Billed for gear that went out (recognised on checkout) in the window. */
	billedCents: number;
	/** Collected in the window, split by how it came in. */
	collectedOnlineCents: number;
	collectedCashCents: number;
	collectedCents: number;
	/** Producing bookings in the window not yet paid — money still owed. */
	outstandingCents: number;
	/** Count of producing bookings recognised in the window. */
	bookingCount: number;
	/** People × nights across those bookings — the yield denominator. */
	gearNights: number;
	/** Average order value, cents. 0 when no bookings. */
	aovCents: number;
	/** Revenue per gear-night, cents. 0 when no gear-nights. */
	perGearNightCents: number;
	/** Real refunds Leon logged (negative ledger payments), in the window,
	 * as a positive number. Excludes Stripe self-test refunds, which never
	 * enter the ledger. */
	refundedCents: number;
}

export function computeRevenue(
	bookings: Booking[],
	payments: PaymentRow[],
	startIso: string | null,
	endIso: string,
): RevenueMetrics {
	// Total paid per booking (any date) — for outstanding.
	const paidByBooking = new Map<number, number>();
	for (const p of payments) {
		paidByBooking.set(p.bookingId, (paidByBooking.get(p.bookingId) ?? 0) + p.amountCents);
	}

	let billed = 0;
	let outstanding = 0;
	let count = 0;
	let gearNights = 0;

	for (const b of bookings) {
		if (b.deletedAt) continue;
		// Revenue recognition: producing bookings, by checkout date.
		if (PRODUCING.has(b.status) && inWindow(b.checkout, startIso, endIso)) {
			const cents = billedCents(b);
			billed += cents;
			count += 1;
			gearNights += b.peopleCount * nights(b);
			// Owed = billed minus everything paid against it (never negative).
			outstanding += Math.max(0, cents - (paidByBooking.get(b.id) ?? 0));
		}
	}

	// Collection: every payment whose date falls in the window, split by
	// method — this is where split/partial payments are counted correctly.
	// A negative payment is a refund; it nets out of collected and is also
	// surfaced separately below.
	let collectedCash = 0;
	let collectedOnline = 0;
	let refunded = 0;
	for (const p of payments) {
		const d = p.createdAt.toISOString().slice(0, 10);
		if (!inWindow(d, startIso, endIso)) continue;
		if (p.amountCents < 0) refunded += -p.amountCents;
		if (p.method === "cash") collectedCash += p.amountCents;
		else collectedOnline += p.amountCents;
	}

	return {
		refundedCents: refunded,
		billedCents: billed,
		collectedOnlineCents: collectedOnline,
		collectedCashCents: collectedCash,
		collectedCents: collectedOnline + collectedCash,
		outstandingCents: outstanding,
		bookingCount: count,
		gearNights,
		aovCents: count > 0 ? Math.round(billed / count) : 0,
		perGearNightCents: gearNights > 0 ? Math.round(billed / gearNights) : 0,
	};
}

/** Forward-looking: producing bookings whose gear is still out or upcoming
 * (checkout today or later) and not yet paid — money already on the books.
 * Window-independent by design; it answers "what's coming". */
export function onTheBooksCents(bookings: Booking[], todayIso: string): number {
	let cents = 0;
	for (const b of bookings) {
		if (b.deletedAt) continue;
		if (!PRODUCING.has(b.status)) continue;
		if (b.checkout < todayIso) continue;
		if (b.paidAt) continue;
		cents += billedCents(b);
	}
	return cents;
}

export interface ExpenseGroup {
	category: string;
	cents: number;
	pct: number;
}

/**
 * Expenses in the window grouped by category (case-normalised so "Fuel" and
 * "fuel" merge), plus gear bought in the window as a synthetic category.
 * Amounts in cents, each with its share of the period total.
 */
export function expenseBreakdown(
	expenses: Array<{ date: string; amount: number; category: string | null }>,
	gearPurchasedEurosInPeriod: number,
	startIso: string | null,
	endIso: string,
): { groups: ExpenseGroup[]; totalCents: number } {
	const byCat = new Map<string, number>();
	for (const e of expenses) {
		if (!inWindow(e.date, startIso, endIso)) continue;
		const cat = (e.category?.trim() || "Uncategorised").toLowerCase();
		byCat.set(cat, (byCat.get(cat) ?? 0) + Math.round(e.amount * 100));
	}
	if (gearPurchasedEurosInPeriod > 0) {
		byCat.set("gear purchases", Math.round(gearPurchasedEurosInPeriod * 100));
	}
	const totalCents = [...byCat.values()].reduce((s, v) => s + v, 0);
	const groups: ExpenseGroup[] = [...byCat.entries()]
		.map(([category, cents]) => ({
			category: category.replace(/\b\w/g, (c) => c.toUpperCase()),
			cents,
			pct: totalCents > 0 ? (cents / totalCents) * 100 : 0,
		}))
		.sort((a, b) => b.cents - a.cents);
	return { groups, totalCents };
}

export function eur(cents: number): string {
	const neg = cents < 0;
	const v = Math.abs(cents) / 100;
	// Whole euros read cleaner on a phone; show cents only when present.
	const s = Number.isInteger(v) ? `€${v}` : `€${v.toFixed(2)}`;
	return neg ? `−${s}` : s;
}
