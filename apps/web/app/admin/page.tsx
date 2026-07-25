import Link from "next/link";
import type { Booking, BookingStatus } from "../lib/db/schema";
import { BookingsFilter } from "./_components/bookings-filter";
import { StatusPicker } from "./_components/status-picker";
import { getCachedBookings } from "./_lib/bookings-cache";
import { isBookingLate } from "./_lib/booking-stage";
import { getCachedFleet } from "./_lib/boards-cache";
import { addDaysIso, formatShortDate, todayIso } from "./_lib/dates";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES: BookingStatus[] = [
	"requested",
	"confirmed",
	"in_progress",
];

interface Props {
	searchParams: Promise<{ status?: string; q?: string }>;
}

function nights(b: Booking): number {
	const a = new Date(`${b.checkin}T00:00:00Z`).getTime();
	const c = new Date(`${b.checkout}T00:00:00Z`).getTime();
	return Math.max(1, Math.round((c - a) / 86400000));
}

function priceCell(b: Booking): string {
	if (b.finalTotal != null) return `€${b.finalTotal}`;
	if (b.estimatedTotal != null) return `~€${b.estimatedTotal}`;
	return "—";
}

export default async function AdminBookingsPage({ searchParams }: Props) {
	const params = await searchParams;
	const rawStatus = params.status ?? "";
	const statusFilter =
		(
			[
				"requested",
				"confirmed",
				"in_progress",
				"cancelled",
				"completed",
			] as BookingStatus[]
		).find((s) => s === rawStatus) ?? null;
	const q = (params.q ?? "").trim();

	// One cached dataset serves the whole page — no per-navigation Neon
	// roundtrips. Mutations revalidate the tag so freshness is unaffected.
	const allBookings = await getCachedBookings();
	if (!allBookings) {
		return (
			<section className="admin-empty">
				<h1>Database not configured</h1>
				<p>Set <code>DATABASE_URL</code> in Vercel to start seeing bookings.</p>
			</section>
		);
	}

	const today = todayIso();
	const inSevenDays = addDaysIso(today, 7);

	const deliveringToday = allBookings.filter(
		(b) =>
			b.checkin === today &&
			ACTIVE_STATUSES.includes(b.status),
	);
	const pickingUpToday = allBookings.filter(
		(b) =>
			b.checkout === today &&
			(b.status === "confirmed" || b.status === "in_progress"),
	);
	const nextSevenDays = allBookings
		.filter(
			(b) =>
				b.checkin > today &&
				b.checkin <= inSevenDays &&
				ACTIVE_STATUSES.includes(b.status),
		)
		.sort((a, b) => a.checkin.localeCompare(b.checkin));

	// Bookings that need a yes/no decision from Leon. This is the primary
	// "in-app notification" surface — visible on every home-screen open,
	// not only when a push landed.
	const needsDecision = allBookings
		.filter((b) => b.status === "requested")
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

	// Confirmed / in-progress bookings that still have people without a
	// board assigned. Boards are the physical constraint — an unassigned
	// confirmed booking is a double-booking risk, so it gets flagged here.
	const fleetData = await getCachedFleet();
	const missingBoards =
		fleetData && fleetData.fleet.some((f) => f.kind === "board")
			? allBookings.filter((b) => {
					if (b.status !== "confirmed" && b.status !== "in_progress")
						return false;
					if (b.checkout < today) return false;
					if (!b.people || b.people.length === 0) return false;
					return b.people.some(
						(_, i) =>
							!fleetData.assignments.some(
								(a) => a.bookingId === b.id && a.personIndex === i,
							),
					);
				})
			: [];

	// Filter for the full list section — in JS over the cached dataset. This
	// used to be a second full DB roundtrip per page load; at Leon's volume
	// (hundreds of rows) an in-memory filter is faster than any query.
	const qLower = q.toLowerCase();
	const filteredBookings = allBookings
		.filter((b) => (statusFilter ? b.status === statusFilter : true))
		.filter((b) =>
			qLower
				? b.name.toLowerCase().includes(qLower) ||
					b.email.toLowerCase().includes(qLower) ||
					(b.accommodation ?? "").toLowerCase().includes(qLower)
				: true,
		)
		.slice(0, 200);

	// Counts per status for the filter chips
	const counts = allBookings.reduce(
		(acc, b) => {
			acc[b.status] = (acc[b.status] ?? 0) + 1;
			return acc;
		},
		{} as Record<BookingStatus, number>,
	);

	return (
		<section className="admin-list-page">
			<header className="admin-page-header">
				<h1>Bookings</h1>
				<Link href="/admin/bookings/new" className="admin-btn admin-btn--primary">
					+ New booking
				</Link>
			</header>

			{needsDecision.length > 0 && (
				<article className="admin-attention">
					<div className="admin-attention-header">
						<span className="admin-attention-kicker">Needs decision</span>
						<span className="admin-attention-count">{needsDecision.length}</span>
					</div>
					<p className="admin-attention-lead">
						{needsDecision.length === 1
							? "1 new booking request is waiting for you."
							: `${needsDecision.length} new booking requests are waiting for you.`}
					</p>
					<ul className="admin-today-list">
						{needsDecision.slice(0, 5).map((b) => (
							<TodayRow key={b.id} b={b} kind="requested" />
						))}
					</ul>
					{needsDecision.length > 5 && (
						<Link
							href="/admin?status=requested"
							className="admin-attention-more"
						>
							See all {needsDecision.length} →
						</Link>
					)}
				</article>
			)}

			{missingBoards.length > 0 && (
				<article className="admin-attention admin-attention--boards">
					<div className="admin-attention-header">
						<span className="admin-attention-kicker">Boards not assigned</span>
						<span className="admin-attention-count">{missingBoards.length}</span>
					</div>
					<p className="admin-attention-lead">
						{missingBoards.length === 1
							? "1 confirmed booking still has people without a board."
							: `${missingBoards.length} confirmed bookings still have people without a board.`}{" "}
						Assign boards on the booking page to avoid double-booking the fleet.
					</p>
					<ul className="admin-today-list">
						{missingBoards.slice(0, 5).map((b) => (
							<TodayRow key={b.id} b={b} kind="upcoming" />
						))}
					</ul>
				</article>
			)}

			{/* ── Today card ── */}
			<div className="admin-today">
				<article className="admin-today-card">
					<div className="admin-today-heading">
						<span className="admin-today-kicker">Today · deliveries</span>
						<span className="admin-today-count">{deliveringToday.length}</span>
					</div>
					{deliveringToday.length === 0 ? (
						<p className="admin-empty-inline">Nothing to deliver today.</p>
					) : (
						<ul className="admin-today-list">
							{deliveringToday.map((b) => (
								<TodayRow key={b.id} b={b} kind="delivery" />
							))}
						</ul>
					)}
				</article>

				<article className="admin-today-card">
					<div className="admin-today-heading">
						<span className="admin-today-kicker">Today · pickups</span>
						<span className="admin-today-count">{pickingUpToday.length}</span>
					</div>
					{pickingUpToday.length === 0 ? (
						<p className="admin-empty-inline">Nothing to pick up today.</p>
					) : (
						<ul className="admin-today-list">
							{pickingUpToday.map((b) => (
								<TodayRow key={b.id} b={b} kind="pickup" />
							))}
						</ul>
					)}
				</article>

				<article className="admin-today-card admin-today-card--wide">
					<div className="admin-today-heading">
						<span className="admin-today-kicker">Next 7 days</span>
						<span className="admin-today-count">{nextSevenDays.length}</span>
					</div>
					{nextSevenDays.length === 0 ? (
						<p className="admin-empty-inline">Nothing on the books for the next week.</p>
					) : (
						<ul className="admin-today-list">
							{nextSevenDays.map((b) => (
								<TodayRow key={b.id} b={b} kind="upcoming" />
							))}
						</ul>
					)}
				</article>
			</div>

			<div className="admin-list-heading">
				<h2>All bookings</h2>
			</div>

			<BookingsFilter counts={counts} total={allBookings.length} />

			{filteredBookings.length === 0 && (
				<p className="admin-empty-inline">
					No bookings match this filter{q ? ` (searching for "${q}")` : ""}.
				</p>
			)}

			<div className="admin-table-wrap">
				<table className="admin-table">
					<thead>
						<tr>
							<th>Received</th>
							<th>Customer</th>
							<th>Dates</th>
							<th>People</th>
							<th>Price</th>
							<th>Status</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{filteredBookings.map((b) => (
							<tr key={b.id}>
								<td>{formatShortDate(b.createdAt.toISOString().slice(0, 10))}</td>
								<td>
									<div className="admin-cell-strong">
										{b.name}
										{b.ownerNotes ? (
											<span
												className="admin-note-dot"
												title={b.ownerNotes.slice(0, 200)}
												aria-label="has owner notes"
											>
												●
											</span>
										) : null}
									</div>
									<div className="admin-cell-muted">{b.email}</div>
								</td>
								<td>
									{formatShortDate(b.checkin)} → {formatShortDate(b.checkout)}
								</td>
								<td>{b.peopleCount}</td>
								<td>{priceCell(b)}</td>
								<td>
									<StatusPicker bookingId={b.id} current={b.status} />
									{isBookingLate(b, today) && (
										<span className="admin-late-badge">Late</span>
									)}
								</td>
								<td>
									<Link
										href={`/admin/bookings/${b.id}`}
										className="admin-row-link"
									>
										Open&nbsp;→
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}

function TodayRow({
	b,
	kind,
}: {
	b: Booking;
	kind: "delivery" | "pickup" | "upcoming" | "requested";
}) {
	const dateStr =
		kind === "pickup"
			? formatShortDate(b.checkout)
			: formatShortDate(b.checkin);
	return (
		<li className="admin-today-row">
			<Link
				href={`/admin/bookings/${b.id}`}
				className="admin-today-link"
			>
				<div className="admin-today-row-left">
					{(kind === "upcoming" || kind === "requested") && (
						<span className="admin-today-date">{dateStr}</span>
					)}
					<span className="admin-today-name">
						{b.name}
						{b.ownerNotes ? (
							<span className="admin-note-dot" aria-hidden="true">
								●
							</span>
						) : null}
					</span>
				</div>
				<div className="admin-today-row-right">
					<span className="admin-today-people">
						{b.peopleCount}p · {nights(b)}n
					</span>
					<span className="admin-today-accommodation">
						{b.accommodation ?? "—"}
					</span>
					<span className={`admin-status admin-status--${b.status}`}>
						{b.status.replace("_", " ")}
					</span>
				</div>
			</Link>
		</li>
	);
}
