"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "../lib/db/client";
import type { BoardStatus, GearKind } from "../lib/db/schema";
import { BOARDS_TAG, findConflict, getCachedFleet } from "./_lib/boards-cache";
import { isValidSize } from "./_lib/gear-sizes";

/**
 * Board-inventory mutations. Same conventions as _actions.ts: server
 * actions only (no REST), updateTag for read-your-own-writes, then
 * revalidatePath for every touched surface.
 *
 * Conflict policy is a hard block — a board can't physically be in two
 * places. There's a theoretical check-then-insert race (the Neon HTTP
 * driver has no transactions), but the admin panel has exactly one user.
 */

const BOARD_STATUSES = new Set<BoardStatus>(["active", "repair", "retired"]);
const GEAR_KINDS = new Set<GearKind>(["board", "wetsuit", "other"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function revalidateBoardSurfaces() {
	updateTag(BOARDS_TAG);
	revalidatePath("/admin/boards");
	revalidatePath("/admin/calendar");
	revalidatePath("/admin");
}

export async function createBoard(formData: FormData) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");

	const kindRaw = ((formData.get("kind") as string) ?? "board").trim() as GearKind;
	const kind: GearKind = GEAR_KINDS.has(kindRaw) ? kindRaw : "board";
	const name = ((formData.get("name") as string) ?? "").trim();
	const size = ((formData.get("size") as string) ?? "").trim();
	const costRaw = ((formData.get("purchaseCost") as string) ?? "").trim();
	const purchaseDate = ((formData.get("purchaseDate") as string) ?? "").trim();
	const notes = ((formData.get("notes") as string) ?? "").trim();

	if (!name || !isValidSize(kind, size)) return;

	await db.insert(schema.boards).values({
		kind,
		name,
		size,
		purchaseCost: costRaw ? Number.parseInt(costRaw, 10) || null : null,
		purchaseDate: ISO_DATE.test(purchaseDate) ? purchaseDate : null,
		notes: notes || null,
	});
	revalidateBoardSurfaces();
}

export async function updateBoard(id: number, formData: FormData) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");

	// Kind is fixed at creation; look it up so size validation matches.
	const data = await getCachedFleet();
	const kind: GearKind =
		data?.fleet.find((b) => b.id === id)?.kind ?? "board";

	const name = ((formData.get("name") as string) ?? "").trim();
	const size = ((formData.get("size") as string) ?? "").trim();
	const costRaw = ((formData.get("purchaseCost") as string) ?? "").trim();
	const purchaseDate = ((formData.get("purchaseDate") as string) ?? "").trim();
	const notes = ((formData.get("notes") as string) ?? "").trim();

	if (!name || !isValidSize(kind, size)) return;

	await db
		.update(schema.boards)
		.set({
			name,
			size,
			purchaseCost: costRaw ? Number.parseInt(costRaw, 10) || null : null,
			purchaseDate: ISO_DATE.test(purchaseDate) ? purchaseDate : null,
			notes: notes || null,
			updatedAt: new Date(),
		})
		.where(eq(schema.boards.id, id));
	revalidateBoardSurfaces();
	revalidatePath(`/admin/boards/${id}`);
}

export async function setBoardStatus(id: number, status: BoardStatus) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	if (!BOARD_STATUSES.has(status)) return;
	await db
		.update(schema.boards)
		.set({ status, updatedAt: new Date() })
		.where(eq(schema.boards.id, id));
	revalidateBoardSurfaces();
	revalidatePath(`/admin/boards/${id}`);
}

/**
 * Assign a board to one person on a booking for [startDate, endDate].
 * On conflict, redirects back to the booking with ?boardError so the
 * detail page can render the reason instead of a crash page.
 */
export async function assignBoard(
	bookingId: number,
	personIndex: number,
	formData: FormData,
) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");

	const boardId = Number.parseInt((formData.get("boardId") as string) ?? "", 10);
	const startDate = (formData.get("startDate") as string) ?? "";
	const endDate = (formData.get("endDate") as string) ?? "";

	if (
		!Number.isFinite(boardId) ||
		!ISO_DATE.test(startDate) ||
		!ISO_DATE.test(endDate) ||
		endDate < startDate
	) {
		redirect(`/admin/bookings/${bookingId}?boardError=Invalid+assignment+details`);
	}

	const data = await getCachedFleet();
	if (!data) throw new Error("Database not configured");

	const board = data.fleet.find((b) => b.id === boardId);
	if (!board || board.kind !== "board" || board.status !== "active") {
		redirect(
			`/admin/bookings/${bookingId}?boardError=${encodeURIComponent(
				"That board isn't active — check its status on the Boards page.",
			)}`,
		);
	}

	const conflict = findConflict(data.assignments, boardId, startDate, endDate);
	if (conflict) {
		redirect(
			`/admin/bookings/${bookingId}?boardError=${encodeURIComponent(
				`${board.name} is already out on booking #${conflict.bookingId} (${conflict.bookingName}, ${conflict.startDate} → ${conflict.endDate}).`,
			)}`,
		);
	}

	await db.insert(schema.boardAssignments).values({
		bookingId,
		personIndex,
		boardId,
		startDate,
		endDate,
	});
	revalidateBoardSurfaces();
	revalidatePath(`/admin/bookings/${bookingId}`);
}

/**
 * One-tap assign: pick the first free active board of the matching size
 * for the person's window and assign it. Saves Leon working the dropdown
 * on a busy confirmation; the conflict check guarantees the pick is
 * genuinely free. Won't substitute a different size — if none of the
 * right size is free it says so, leaving the choice to Leon.
 */
export async function autoAssignBoard(
	bookingId: number,
	personIndex: number,
	size: string,
	startDate: string,
	endDate: string,
) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate) || endDate < startDate) {
		redirect(`/admin/bookings/${bookingId}?boardError=Invalid+dates`);
	}
	const data = await getCachedFleet();
	if (!data) throw new Error("Database not configured");

	const pick = data.fleet
		.filter((b) => b.kind === "board" && b.status === "active" && b.size === size)
		.find((b) => !findConflict(data.assignments, b.id, startDate, endDate));

	if (!pick) {
		redirect(
			`/admin/bookings/${bookingId}?boardError=${encodeURIComponent(
				`No free ${size} board for ${startDate} → ${endDate}. Assign one manually or free one up.`,
			)}`,
		);
	}

	await db.insert(schema.boardAssignments).values({
		bookingId,
		personIndex,
		boardId: pick.id,
		startDate,
		endDate,
	});
	revalidateBoardSurfaces();
	revalidatePath(`/admin/bookings/${bookingId}`);
}

/**
 * Attach booking-level extra gear (roof rack, poncho, spare wetsuit —
 * any active fleet item, boards included) to a booking. Stored as an
 * assignment with personIndex = -1 so it rides the same availability
 * and conflict machinery: the same rack can't be lent out twice for
 * overlapping dates. Whether Leon charged for it or threw it in for
 * free lives in the notes — the ledger doesn't care.
 */
export async function attachGear(bookingId: number, formData: FormData) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");

	const gearId = Number.parseInt((formData.get("gearId") as string) ?? "", 10);
	const startDate = (formData.get("startDate") as string) ?? "";
	const endDate = (formData.get("endDate") as string) ?? "";
	const notes = ((formData.get("notes") as string) ?? "").trim();

	if (
		!Number.isFinite(gearId) ||
		!ISO_DATE.test(startDate) ||
		!ISO_DATE.test(endDate) ||
		endDate < startDate
	) {
		redirect(`/admin/bookings/${bookingId}?boardError=Invalid+gear+details`);
	}

	const data = await getCachedFleet();
	if (!data) throw new Error("Database not configured");

	const item = data.fleet.find((b) => b.id === gearId);
	if (!item || item.status !== "active") {
		redirect(
			`/admin/bookings/${bookingId}?boardError=${encodeURIComponent(
				"That item isn't active — check its status on the Fleet page.",
			)}`,
		);
	}

	const conflict = findConflict(data.assignments, gearId, startDate, endDate);
	if (conflict) {
		redirect(
			`/admin/bookings/${bookingId}?boardError=${encodeURIComponent(
				`${item.name} is already out on booking #${conflict.bookingId} (${conflict.bookingName}, ${conflict.startDate} → ${conflict.endDate}).`,
			)}`,
		);
	}

	await db.insert(schema.boardAssignments).values({
		bookingId,
		personIndex: -1,
		boardId: gearId,
		startDate,
		endDate,
		notes: notes || null,
	});
	revalidateBoardSurfaces();
	revalidatePath(`/admin/bookings/${bookingId}`);
}

/**
 * Mid-booking swap: truncate the old assignment to end on swapDate and
 * open a new one from swapDate to the old end, linked via swappedFromId.
 * Same-day overlap of old and new board is intentional — both boards
 * touch the van on swap day.
 */
export async function swapBoard(assignmentId: number, formData: FormData) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");

	const newBoardId = Number.parseInt(
		(formData.get("newBoardId") as string) ?? "",
		10,
	);
	const swapDate = (formData.get("swapDate") as string) ?? "";
	const notes = ((formData.get("notes") as string) ?? "").trim();

	const data = await getCachedFleet();
	if (!data) throw new Error("Database not configured");

	const current = data.assignments.find((a) => a.id === assignmentId);
	if (!current) return;
	const backTo = `/admin/bookings/${current.bookingId}`;

	if (
		!Number.isFinite(newBoardId) ||
		!ISO_DATE.test(swapDate) ||
		swapDate < current.startDate ||
		swapDate > current.endDate
	) {
		redirect(
			`${backTo}?boardError=${encodeURIComponent(
				"Swap date must fall inside the current assignment window.",
			)}`,
		);
	}

	const board = data.fleet.find((b) => b.id === newBoardId);
	if (!board || board.kind !== "board" || board.status !== "active") {
		redirect(
			`${backTo}?boardError=${encodeURIComponent(
				"That board isn't active — check its status on the Boards page.",
			)}`,
		);
	}

	const conflict = findConflict(
		data.assignments,
		newBoardId,
		swapDate,
		current.endDate,
		assignmentId,
	);
	if (conflict) {
		redirect(
			`${backTo}?boardError=${encodeURIComponent(
				`${board.name} is already out on booking #${conflict.bookingId} (${conflict.bookingName}, ${conflict.startDate} → ${conflict.endDate}).`,
			)}`,
		);
	}

	await db
		.update(schema.boardAssignments)
		.set({ endDate: swapDate })
		.where(eq(schema.boardAssignments.id, assignmentId));
	await db.insert(schema.boardAssignments).values({
		bookingId: current.bookingId,
		personIndex: current.personIndex,
		boardId: newBoardId,
		startDate: swapDate,
		endDate: current.endDate,
		swappedFromId: assignmentId,
		notes: notes || null,
	});
	revalidateBoardSurfaces();
	revalidatePath(backTo);
}

/**
 * Remove an assignment (wrong pick, customer downgraded, or undoing a
 * mistaken swap). Removing a swapped-in row restores the swapped-from
 * assignment's original end date — swapBoard truncated it to the swap
 * day, and the removed row's endDate IS that original end. Without the
 * restore, the customer would still physically hold the old board while
 * the calendar shows it free (double-booking risk). If the restore
 * recreates an overlap with something assigned in the meantime, we
 * restore anyway: it mirrors physical reality, and the calendar making
 * the clash visible is the point.
 */
export async function removeAssignment(assignmentId: number) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");

	const data = await getCachedFleet();
	const removed = data?.assignments.find((a) => a.id === assignmentId);
	const bookingId = removed?.bookingId;

	let failed = false;
	try {
		if (removed?.swappedFromId != null) {
			await db
				.update(schema.boardAssignments)
				.set({ endDate: removed.endDate })
				.where(eq(schema.boardAssignments.id, removed.swappedFromId));
		}
		await db
			.delete(schema.boardAssignments)
			.where(eq(schema.boardAssignments.id, assignmentId));
	} catch (err) {
		// Most likely a 23503: a later swap row references this one
		// (stale page on another device). Surface it instead of crashing.
		console.error("removeAssignment error:", err);
		failed = true;
	}

	revalidateBoardSurfaces();
	if (failed && bookingId != null) {
		redirect(
			`/admin/bookings/${bookingId}?boardError=${encodeURIComponent(
				"Couldn't remove — a later swap builds on this assignment. Remove the newest link in the chain first.",
			)}`,
		);
	}
	if (bookingId != null) revalidatePath(`/admin/bookings/${bookingId}`);
}
