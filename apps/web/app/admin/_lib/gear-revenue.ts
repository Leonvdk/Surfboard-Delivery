import type { GearKind } from "../../lib/db/schema";
import { calcPackagePrice } from "../../lib/pricing";

/**
 * Per-gear revenue attribution — "how much has this physical item earned?".
 *
 * We track cost per fleet item already (purchaseCost); this splits each
 * booking's revenue back across the items that actually served it, so a board
 * or wetsuit can be read as an asset: collected vs cost = net.
 *
 * The hard part is a package price is one number covering board + wetsuit
 * (+ premium extras). The rules, chosen to be defensible and to reconcile
 * exactly to real money:
 *
 *  1. Decompose each person's package by the PRICE LADDER for their rental
 *     length: board portion = Board-Only price; wetsuit portion = Full −
 *     Board-Only (the marginal wetsuit value); premium portion = Premium −
 *     Full. The premium delta is attributed to the BOARD, because the premium
 *     tier's defining feature is the mid-stay board swap.
 *  2. A person's board money follows their assigned board(s). A swap chain
 *     splits that money across the boards by each board's day-share.
 *  3. A person's wetsuit money attaches to a wetsuit UNIT only if one was
 *     actually assigned — either to that person, or from a booking-level pool
 *     of wetsuits (one consumed per person needing one). Otherwise it stays
 *     "unattributed" rather than being faked onto a unit we don't know.
 *  4. Everything is scaled so the sum of all component weights equals the
 *     booking's real billed amount. Group discounts, a custom final price and
 *     add-ons therefore reconcile proportionally: per-item collected always
 *     sums back to booking revenue (attributed + unattributed = billed).
 *
 * Amounts are in CENTS throughout.
 */

export interface AllocPerson {
	package: string;
	wetsuitSize: string;
	checkin?: string;
	checkout?: string;
}

export interface AllocAssignment {
	boardId: number;
	/** Index into the booking's people, or -1 for booking-level extra gear. */
	personIndex: number;
	startDate: string;
	endDate: string;
	kind: GearKind;
}

export interface AllocBooking {
	checkin: string;
	checkout: string;
	/** finalTotal ?? estimatedTotal, in cents. */
	billedCents: number;
	people: AllocPerson[];
}

export interface Allocation {
	/** boardId → cents earned by that physical item on this booking. */
	byGearId: Map<number, number>;
	/** Revenue whose component (usually a wetsuit) had no assigned unit. */
	unattributedCents: number;
}

/** Older package values carried a duration suffix ("premium-2w"). */
function normalisePackage(value: string): string {
	return (value || "").replace(/-\d+w$/, "");
}

/** Inclusive day count — delivery and pickup day both bill, matching the rest
 * of the app. Min 1. */
function inclusiveDays(startIso: string, endIso: string): number {
	const a = new Date(`${startIso}T00:00:00Z`).getTime();
	const b = new Date(`${endIso}T00:00:00Z`).getTime();
	if (Number.isNaN(a) || Number.isNaN(b)) return 1;
	return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

/**
 * Effective tier for revenue split. Mirrors the "delivery load" rule used in
 * the gear summary: a Board-Only line with a wetsuit booked is really a Full
 * package. `custom` follows the same wetsuit test.
 */
function effectiveTier(p: AllocPerson): "boardOnly" | "fullPackage" | "premium" {
	const norm = normalisePackage(p.package);
	if (norm === "premium") return "premium";
	if (norm === "full") return "fullPackage";
	if (p.wetsuitSize && p.wetsuitSize.trim() !== "") return "fullPackage";
	return "boardOnly";
}

interface PersonWeights {
	boardCents: number;
	wetsuitCents: number;
}

/** Board + wetsuit component weights for one person, in cents. */
function personWeights(p: AllocPerson, booking: AllocBooking): PersonWeights {
	const days = inclusiveDays(p.checkin || booking.checkin, p.checkout || booking.checkout);
	const boardOnly = calcPackagePrice("boardOnly", days) * 100;
	const full = calcPackagePrice("fullPackage", days) * 100;
	const premium = calcPackagePrice("premium", days) * 100;
	const tier = effectiveTier(p);

	const wetsuitCents = tier === "boardOnly" ? 0 : full - boardOnly;
	// Premium delta rides with the board (the swap is the premium feature).
	const premiumDelta = tier === "premium" ? premium - full : 0;
	const boardCents = boardOnly + premiumDelta;
	return { boardCents, wetsuitCents };
}

/**
 * Split one booking's billed revenue across the physical items that served it.
 * `assignments` are this booking's assignments only, each carrying its gear
 * kind.
 */
export function allocateBooking(booking: AllocBooking, assignments: AllocAssignment[]): Allocation {
	const byGearId = new Map<number, number>();
	let unattributed = 0;
	const add = (id: number, cents: number) => byGearId.set(id, (byGearId.get(id) ?? 0) + cents);

	// A booking-level wetsuit pool (personIndex -1) consumed one per person.
	const wetsuitPool = assignments
		.filter((a) => a.personIndex === -1 && a.kind === "wetsuit")
		.map((a) => a.boardId);
	let poolCursor = 0;

	// Accumulate raw (pre-scale) weights so we can scale to the real billed
	// total at the end.
	const rawByGear = new Map<number, number>();
	let rawUnattributed = 0;
	let rawTotal = 0;
	const rawAdd = (id: number, cents: number) => rawByGear.set(id, (rawByGear.get(id) ?? 0) + cents);

	booking.people.forEach((p, i) => {
		const w = personWeights(p, booking);
		rawTotal += w.boardCents + w.wetsuitCents;

		// Board money → this person's board chain, split by day-share.
		const chain = assignments
			.filter((a) => a.personIndex === i && a.kind === "board")
			.sort((a, b) => a.startDate.localeCompare(b.startDate));
		if (chain.length > 0 && w.boardCents > 0) {
			const spans = chain.map((a) => inclusiveDays(a.startDate, a.endDate));
			const spanTotal = spans.reduce((s, v) => s + v, 0) || 1;
			chain.forEach((a, k) => {
				const span = spans[k] ?? 0;
				rawAdd(a.boardId, (w.boardCents * span) / spanTotal);
			});
		} else if (w.boardCents > 0) {
			rawUnattributed += w.boardCents;
		}

		// Wetsuit money → a wetsuit assigned to this person, else one from the
		// booking-level pool, else unattributed.
		if (w.wetsuitCents > 0) {
			const ownWetsuits = assignments.filter((a) => a.personIndex === i && a.kind === "wetsuit");
			const pooled = wetsuitPool[poolCursor];
			if (ownWetsuits.length > 0) {
				const each = w.wetsuitCents / ownWetsuits.length;
				for (const a of ownWetsuits) rawAdd(a.boardId, each);
			} else if (pooled !== undefined) {
				rawAdd(pooled, w.wetsuitCents);
				poolCursor += 1;
			} else {
				rawUnattributed += w.wetsuitCents;
			}
		}
	});

	// Scale raw weights to the booking's real billed amount so per-item
	// numbers reconcile to money actually charged. No weights → nothing to
	// attribute (e.g. a booking with no people data).
	if (rawTotal > 0 && booking.billedCents > 0) {
		const s = booking.billedCents / rawTotal;
		for (const [id, cents] of rawByGear) add(id, Math.round(cents * s));
		unattributed = Math.round(rawUnattributed * s);
	}

	return { byGearId, unattributedCents: unattributed };
}

export interface GearEarning {
	collectedCents: number;
	bookingCount: number;
}

/** A booking plus the assignments (kind-tagged) that belong to it. */
export interface BookingWithAssignments {
	booking: AllocBooking;
	assignments: AllocAssignment[];
}

/**
 * Lifetime earnings per gear id across many bookings. Callers pass only the
 * bookings whose revenue counts (producing, not deleted). Returns a map keyed
 * by gear id, plus the total left unattributed.
 */
export function aggregateGearEarnings(items: BookingWithAssignments[]): {
	byGearId: Map<number, GearEarning>;
	unattributedCents: number;
} {
	const byGearId = new Map<number, GearEarning>();
	let unattributed = 0;
	for (const { booking, assignments } of items) {
		const alloc = allocateBooking(booking, assignments);
		unattributed += alloc.unattributedCents;
		for (const [id, cents] of alloc.byGearId) {
			const cur = byGearId.get(id) ?? { collectedCents: 0, bookingCount: 0 };
			cur.collectedCents += cents;
			cur.bookingCount += 1;
			byGearId.set(id, cur);
		}
	}
	return { byGearId, unattributedCents: unattributed };
}
