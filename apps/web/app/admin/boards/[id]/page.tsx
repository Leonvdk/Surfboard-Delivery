import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, schema } from "../../../lib/db/client";
import { getCachedBookings } from "../../_lib/bookings-cache";
import { getCachedFleet } from "../../_lib/boards-cache";
import { formatShortDate } from "../../_lib/dates";
import { gearEarningsByBooking } from "../../_lib/gear-earnings";
import { eur } from "../../_lib/revenue-metrics";

export const dynamic = "force-dynamic";

/**
 * Board history page. Reads the DB directly — NOT the cached fleet: a
 * freshly created board could be missing from a stale cache entry, which
 * made this page notFound() right after adding a board (the "edit → 404"
 * Leon hit). Editing itself now happens in the modal on /admin/boards;
 * this page is the assignment-history view.
 */

const STATUS_LABEL: Record<string, string> = {
	active: "Active",
	repair: "In repair",
	retired: "Retired",
};

export default async function BoardDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: idStr } = await params;
	const id = Number.parseInt(idStr, 10);
	if (Number.isNaN(id)) notFound();

	const db = getDb();
	if (!db) {
		return (
			<section className="admin-empty">
				<h1>Database not configured</h1>
				<p>Set <code>DATABASE_URL</code> to manage the fleet.</p>
			</section>
		);
	}

	const [board] = await db
		.select()
		.from(schema.boards)
		.where(eq(schema.boards.id, id))
		.limit(1);
	if (!board) notFound();

	const history = await db
		.select({
			id: schema.boardAssignments.id,
			bookingId: schema.boardAssignments.bookingId,
			startDate: schema.boardAssignments.startDate,
			endDate: schema.boardAssignments.endDate,
			swappedFromId: schema.boardAssignments.swappedFromId,
			notes: schema.boardAssignments.notes,
			bookingName: schema.bookings.name,
			bookingStatus: schema.bookings.status,
		})
		.from(schema.boardAssignments)
		.innerJoin(
			schema.bookings,
			eq(schema.boardAssignments.bookingId, schema.bookings.id),
		)
		.where(eq(schema.boardAssignments.boardId, id));

	const sorted = [...history].sort((a, b) =>
		b.startDate.localeCompare(a.startDate),
	);

	// What this item has earned — its attributed slice of every producing
	// booking it served (see gear-revenue for the split rules).
	const [fleetData, allBookings] = await Promise.all([
		getCachedFleet(),
		getCachedBookings(),
	]);
	const earnedByBooking =
		fleetData && allBookings
			? gearEarningsByBooking(allBookings, fleetData.fleet, fleetData.assignments, id)
			: new Map<number, number>();
	let collectedCents = 0;
	for (const v of earnedByBooking.values()) collectedCents += v;
	const netCents = collectedCents - (board.purchaseCost ?? 0) * 100;

	return (
		<section className="admin-detail">
			<Link href="/admin/boards" className="admin-back">
				← All boards
			</Link>

			<header className="admin-detail-header">
				<h1>
					{board.name} <span className="admin-detail-id">#{board.id}</span>
				</h1>
			</header>

			<article className="admin-card">
				<h2>Details</h2>
				<dl className="admin-dl">
					<dt>Size</dt>
					<dd>{board.size}</dd>
					<dt>Status</dt>
					<dd>
						<span className={`admin-board-status admin-board-status--${board.status}`}>
							{STATUS_LABEL[board.status] ?? board.status}
						</span>
					</dd>
					<dt>Cost</dt>
					<dd>{board.purchaseCost != null ? `€${board.purchaseCost}` : "—"}</dd>
					<dt>Collected</dt>
					<dd>{collectedCents > 0 ? eur(collectedCents) : "—"}</dd>
					<dt>Net</dt>
					<dd
						className={
							(collectedCents > 0 || board.purchaseCost != null) && netCents < 0
								? "admin-cell-negative"
								: undefined
						}
					>
						{collectedCents > 0 || board.purchaseCost != null ? eur(netCents) : "—"}
					</dd>
					<dt>Purchased</dt>
					<dd>{board.purchaseDate ? formatShortDate(board.purchaseDate) : "—"}</dd>
					{board.notes && (
						<>
							<dt>Notes</dt>
							<dd>{board.notes}</dd>
						</>
					)}
				</dl>
				<p className="admin-card-hint">
					Edit this board from the{" "}
					<Link href="/admin/boards" className="admin-row-link">
						fleet list
					</Link>{" "}
					— the Edit button opens it in a modal.
				</p>
			</article>

			<article className="admin-card">
				<h2>Assignment history</h2>
				<p className="admin-card-hint">
					The € on each row is this item&apos;s share of that booking&apos;s
					revenue — for a board+wetsuit or premium package, split by the value
					of the part it provided.
				</p>
				{sorted.length === 0 ? (
					<p className="admin-empty-inline">
						This board hasn&apos;t been on any bookings yet.
					</p>
				) : (
					<ul className="admin-board-history">
						{sorted.map((a) => (
							<li key={a.id} className="admin-board-history-row">
								<span className="admin-board-history-dates">
									{formatShortDate(a.startDate)} → {formatShortDate(a.endDate)}
								</span>
								<Link
									href={`/admin/bookings/${a.bookingId}`}
									className="admin-row-link"
								>
									#{a.bookingId} · {a.bookingName}
								</Link>
								<span className={`admin-status admin-status--${a.bookingStatus}`}>
									{a.bookingStatus.replace("_", " ")}
								</span>
								{a.swappedFromId != null && (
									<span className="admin-board-swap-flag">swapped in</span>
								)}
								{earnedByBooking.get(a.bookingId) ? (
									<span className="admin-board-earned">
										{eur(earnedByBooking.get(a.bookingId)!)}
									</span>
								) : null}
								{a.notes && <span className="admin-cell-muted">{a.notes}</span>}
							</li>
						))}
					</ul>
				)}
			</article>
		</section>
	);
}
