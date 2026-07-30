import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb, schema } from "../../lib/db/client";
import type { Board, BookingStatus } from "../../lib/db/schema";

/**
 * Cached fleet + assignments dataset, mirroring bookings-cache. One SELECT
 * pair serves the boards list, the booking-detail assignment pickers, the
 * calendar availability strip, and the dashboard unassigned-boards flag.
 * Board mutations call updateTag(BOARDS_TAG).
 */

export const BOARDS_TAG = "boards";

/** Assignment row joined with just enough booking context to render/decide. */
export interface AssignmentWithBooking {
	id: number;
	bookingId: number;
	personIndex: number;
	boardId: number;
	startDate: string;
	endDate: string;
	swappedFromId: number | null;
	notes: string | null;
	returnNote: string | null;
	createdAt: Date;
	bookingName: string;
	bookingStatus: BookingStatus;
	bookingDeleted: boolean;
}

export interface FleetData {
	fleet: Board[];
	assignments: AssignmentWithBooking[];
}

const fetchFleet = unstable_cache(
	async (): Promise<{
		fleet: Board[];
		assignments: Array<Omit<AssignmentWithBooking, "createdAt"> & { createdAt: Date }>;
	} | null> => {
		const db = getDb();
		if (!db) return null;
		const [fleet, assignments] = await Promise.all([
			db.select().from(schema.boards).orderBy(schema.boards.size, schema.boards.name),
			db
				.select({
					id: schema.boardAssignments.id,
					bookingId: schema.boardAssignments.bookingId,
					personIndex: schema.boardAssignments.personIndex,
					boardId: schema.boardAssignments.boardId,
					startDate: schema.boardAssignments.startDate,
					endDate: schema.boardAssignments.endDate,
					swappedFromId: schema.boardAssignments.swappedFromId,
					notes: schema.boardAssignments.notes,
					returnNote: schema.boardAssignments.returnNote,
					createdAt: schema.boardAssignments.createdAt,
					bookingName: schema.bookings.name,
					bookingStatus: schema.bookings.status,
					bookingDeletedAt: schema.bookings.deletedAt,
				})
				.from(schema.boardAssignments)
				.innerJoin(
					schema.bookings,
					eq(schema.boardAssignments.bookingId, schema.bookings.id),
				),
		]);
		return {
			fleet,
			assignments: assignments.map((a) => ({
				id: a.id,
				bookingId: a.bookingId,
				personIndex: a.personIndex,
				boardId: a.boardId,
				startDate: a.startDate,
				endDate: a.endDate,
				swappedFromId: a.swappedFromId,
				notes: a.notes,
				returnNote: a.returnNote,
				createdAt: a.createdAt,
				bookingName: a.bookingName,
				bookingStatus: a.bookingStatus,
				bookingDeleted: a.bookingDeletedAt != null,
			})),
		};
	},
	["admin-fleet"],
	{ tags: [BOARDS_TAG], revalidate: 300 },
);

/** Fleet + assignments. Null when DATABASE_URL is unset. */
export async function getCachedFleet(): Promise<FleetData | null> {
	const data = await fetchFleet();
	if (!data) return null;
	return {
		// unstable_cache round-trips through JSON — rehydrate timestamps.
		fleet: data.fleet.map((b) => ({
			...b,
			createdAt: new Date(b.createdAt),
			updatedAt: new Date(b.updatedAt),
		})),
		assignments: data.assignments.map((a) => ({
			...a,
			createdAt: new Date(a.createdAt),
		})),
	};
}

/* ── Pure availability logic ─────────────────────────────────────── */

/** Inclusive ISO-date interval overlap. */
export function datesOverlap(
	aStart: string,
	aEnd: string,
	bStart: string,
	bEnd: string,
): boolean {
	return !(aEnd < bStart || aStart > bEnd);
}

/**
 * Assignments that block a board: cancelled bookings and soft-deleted
 * bookings release their boards automatically by being excluded here.
 */
export function blockingAssignments(
	assignments: AssignmentWithBooking[],
): AssignmentWithBooking[] {
	return assignments.filter(
		(a) => !a.bookingDeleted && a.bookingStatus !== "cancelled",
	);
}

/**
 * Returns the conflicting assignment if `boardId` is NOT free for the
 * inclusive window [from, to], else null. `ignoreAssignmentId` lets a swap
 * check the new board against everything except the assignment being
 * replaced.
 */
export function findConflict(
	assignments: AssignmentWithBooking[],
	boardId: number,
	from: string,
	to: string,
	ignoreAssignmentId?: number,
): AssignmentWithBooking | null {
	for (const a of blockingAssignments(assignments)) {
		if (a.boardId !== boardId) continue;
		if (ignoreAssignmentId != null && a.id === ignoreAssignmentId) continue;
		if (datesOverlap(a.startDate, a.endDate, from, to)) return a;
	}
	return null;
}

/** Whether the board is out on some booking today. */
export function isOutToday(
	assignments: AssignmentWithBooking[],
	boardId: number,
	todayIso: string,
): AssignmentWithBooking | null {
	return findConflict(assignments, boardId, todayIso, todayIso);
}

/**
 * First date >= fromIso on which the board has no blocking assignment.
 * Walks merged busy intervals; O(n log n), n = assignments per board.
 */
export function nextFreeDate(
	assignments: AssignmentWithBooking[],
	boardId: number,
	fromIso: string,
): string {
	const busy = blockingAssignments(assignments)
		.filter((a) => a.boardId === boardId && a.endDate >= fromIso)
		.sort((a, b) => a.startDate.localeCompare(b.startDate));

	let candidate = fromIso;
	for (const a of busy) {
		if (a.startDate > candidate) break;
		const dayAfter = addDaysIsoLocal(a.endDate, 1);
		if (dayAfter > candidate) candidate = dayAfter;
	}
	return candidate;
}

function addDaysIsoLocal(iso: string, days: number): string {
	const d = new Date(`${iso}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}
