import type { Board, Booking } from "../../lib/db/schema";
import type { AssignmentWithBooking } from "./boards-cache";
import {
	type AllocAssignment,
	type AllocBooking,
	aggregateGearEarnings,
	allocateBooking,
	type GearEarning,
} from "./gear-revenue";

/**
 * Bridges cached admin data (bookings + fleet assignments) into the pure
 * gear-revenue engine, so the fleet list and board detail share one code
 * path. Only "producing" bookings count — revenue is recognised the same way
 * as the Revenue page.
 */

const PRODUCING = new Set(["confirmed", "in_progress", "completed"]);

function billedCents(b: Booking): number {
	return Math.round((b.finalTotal ?? b.estimatedTotal ?? 0) * 100);
}

function toAllocBooking(b: Booking): AllocBooking {
	return {
		checkin: b.checkin,
		checkout: b.checkout,
		billedCents: billedCents(b),
		people: (b.people ?? []).map((p) => ({
			package: p.package,
			wetsuitSize: p.wetsuitSize,
			checkin: p.checkin,
			checkout: p.checkout,
		})),
	};
}

/** Group kind-tagged assignments by booking id. */
function assignmentsByBooking(
	fleet: Board[],
	assignments: AssignmentWithBooking[],
): Map<number, AllocAssignment[]> {
	const kindById = new Map(fleet.map((f) => [f.id, f.kind]));
	const perBooking = new Map<number, AllocAssignment[]>();
	for (const a of assignments) {
		const kind = kindById.get(a.boardId);
		if (!kind) continue;
		const arr = perBooking.get(a.bookingId) ?? [];
		arr.push({
			boardId: a.boardId,
			personIndex: a.personIndex,
			startDate: a.startDate,
			endDate: a.endDate,
			kind,
		});
		perBooking.set(a.bookingId, arr);
	}
	return perBooking;
}

export interface GearEarningsResult {
	byGearId: Map<number, GearEarning>;
	unattributedCents: number;
	totalCollectedCents: number;
}

/** Lifetime collected per fleet item, across all producing bookings. */
export function buildGearEarnings(
	bookings: Booking[],
	fleet: Board[],
	assignments: AssignmentWithBooking[],
): GearEarningsResult {
	const perBooking = assignmentsByBooking(fleet, assignments);
	const items = bookings
		.filter((b) => !b.deletedAt && PRODUCING.has(b.status))
		.map((b) => ({
			booking: toAllocBooking(b),
			assignments: perBooking.get(b.id) ?? [],
		}));
	const agg = aggregateGearEarnings(items);
	let total = 0;
	for (const v of agg.byGearId.values()) total += v.collectedCents;
	return {
		byGearId: agg.byGearId,
		unattributedCents: agg.unattributedCents,
		totalCollectedCents: total,
	};
}

/**
 * For the board detail page: how much this one item earned on each booking it
 * served. Runs the full per-booking split (so swaps and packages are handled)
 * and keeps only this item's slice.
 */
export function gearEarningsByBooking(
	bookings: Booking[],
	fleet: Board[],
	assignments: AssignmentWithBooking[],
	gearId: number,
): Map<number, number> {
	const perBooking = assignmentsByBooking(fleet, assignments);
	const out = new Map<number, number>();
	for (const b of bookings) {
		if (b.deletedAt || !PRODUCING.has(b.status)) continue;
		const asg = perBooking.get(b.id);
		if (!asg?.some((a) => a.boardId === gearId)) continue;
		const alloc = allocateBooking(toAllocBooking(b), asg);
		const cents = alloc.byGearId.get(gearId);
		if (cents) out.set(b.id, cents);
	}
	return out;
}
