import Link from "next/link";
import type { Booking, BookingStatus } from "../lib/db/schema";
import { BookingsFilter } from "./_components/bookings-filter";
import { StatusPicker } from "./_components/status-picker";
import { getCachedBookings } from "./_lib/bookings-cache";
import {
	currentStageKey,
	currentStageLabel,
	isBookingLate,
	toStageInputs,
} from "./_lib/booking-stage";
import { getCachedFleet } from "./_lib/boards-cache";
import { addDaysIso, formatShortDate, todayIso } from "./_lib/dates";
import { getSyncHealth } from "../lib/google-calendar";
import { ExternalIcon, WarningIcon } from "./_components/icons";
import { accommodationLabel, mapsUrl } from "./_lib/links";
import { getAddonTariff } from "../lib/pricing";

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

	// Van-load checklist: everything to load for today's deliveries, summed
	// across bookings, so Leon loads once instead of opening each booking —
	// and doesn't drive out one board short.
	const loadTally = (bs: Booking[]) => {
		const boards = new Map<string, number>();
		const wetsuits = new Map<string, number>();
		const extras = new Map<string, number>();
		for (const b of bs) {
			for (const p of b.people ?? []) {
				if (p.board) boards.set(p.board, (boards.get(p.board) ?? 0) + 1);
				if (p.wetsuitSize)
					wetsuits.set(p.wetsuitSize, (wetsuits.get(p.wetsuitSize) ?? 0) + 1);
			}
			for (const a of b.addons ?? []) {
				const label = getAddonTariff(a.key)?.label ?? a.key;
				extras.set(label, (extras.get(label) ?? 0) + a.quantity);
			}
		}
		const fmt = (m: Map<string, number>) =>
			[...m.entries()]
				.sort((a, b) => a[0].localeCompare(b[0]))
				.map(([k, n]) => `${n}× ${k}`);
		return { boards: fmt(boards), wetsuits: fmt(wetsuits), extras: fmt(extras) };
	};

	// Ordered into a sensible run: by scheduled time (untimed last), so the
	// list reads top-to-bottom as the morning goes.
	const byRunTime = (t: (b: Booking) => string | null) => (a: Booking, b: Booking) =>
		(t(a) ?? "99:99").localeCompare(t(b) ?? "99:99");
	const deliveringToday = allBookings
		.filter((b) => b.checkin === today && ACTIVE_STATUSES.includes(b.status))
		.sort(byRunTime((b) => b.deliveryTime));
	const pickingUpToday = allBookings
		.filter(
			(b) =>
				b.checkout === today &&
				(b.status === "confirmed" || b.status === "in_progress"),
		)
		.sort(byRunTime((b) => b.pickupTime));
	const vanLoad = loadTally(deliveringToday);
	const hasVanLoad =
		vanLoad.boards.length + vanLoad.wetsuits.length + vanLoad.extras.length > 0;
	// Next 7 days covers BOTH runs — a delivery going out and a booking
	// coming back both need Leon in the van. One booking can appear twice
	// (its delivery this week, its pickup next), so we build per-run items
	// rather than filtering the booking list.
	type UpcomingRun = {
		b: Booking;
		kind: "upcoming-delivery" | "upcoming-pickup";
		date: string;
	};
	const nextSevenDays: UpcomingRun[] = [];
	for (const b of allBookings) {
		if (
			b.checkin > today &&
			b.checkin <= inSevenDays &&
			ACTIVE_STATUSES.includes(b.status)
		) {
			nextSevenDays.push({ b, kind: "upcoming-delivery", date: b.checkin });
		}
		// Pickups only for gear that actually went out — same rule as today's
		// pickups. A still-unconfirmed request has nothing to collect.
		if (
			b.checkout > today &&
			b.checkout <= inSevenDays &&
			(b.status === "confirmed" || b.status === "in_progress")
		) {
			nextSevenDays.push({ b, kind: "upcoming-pickup", date: b.checkout });
		}
	}
	nextSevenDays.sort(
		(a, b) =>
			a.date.localeCompare(b.date) ||
			// Same day: deliveries before pickups (drop off, then collect).
			(a.kind === "upcoming-delivery" ? -1 : 1),
	);

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

	// Calendar health — surfaced here so a broken or stalled sync is seen
	// on the page Leon opens daily, not only if he visits /admin/calendar.
	const calendarHealth = await getSyncHealth();
	const calendarBroken =
		calendarHealth.configured &&
		calendarHealth.status != null &&
		(!calendarHealth.status.ok || calendarHealth.stale);

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

	// Gear that's overdue back: a booking still confirmed / in-progress
	// whose pickup date has passed. The board is sitting at a customer's
	// place and blocking the next booking, so it's flagged to chase.
	const overdueGear = allBookings
		.filter(
			(b) =>
				(b.status === "confirmed" || b.status === "in_progress") &&
				b.checkout < today,
		)
		.sort((a, b) => a.checkout.localeCompare(b.checkout));

	// Awaiting payment: a link was sent but the booking isn't paid, and the
	// delivery is close (within 3 days) or already past. This is money about
	// to walk out the door on gear that's about to go out — surfaced so
	// Leon collects before delivering, not after.
	const awaitingPayment = allBookings
		.filter(
			(b) =>
				Boolean(b.stripePaymentLinkUrl) &&
				!b.paidAt &&
				(b.status === "confirmed" || b.status === "in_progress") &&
				b.checkin <= addDaysIso(today, 3),
		)
		.sort((a, b) => a.checkin.localeCompare(b.checkin));

	// Boards sitting in `repair` that are assigned to a booking still to
	// come (or in progress). If the repair isn't finished in time, that
	// run has no board — so it's flagged here, with the soonest booking it
	// blocks, while there's still time to fix or reassign.
	const repairNeeded = fleetData
		? fleetData.fleet
				.filter((board) => board.status === "repair")
				.map((board) => {
					const next = fleetData.assignments
						.filter(
							(a) =>
								a.boardId === board.id &&
								!a.bookingDeleted &&
								a.bookingStatus !== "cancelled" &&
								a.endDate >= today,
						)
						.sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
					return next ? { board, next } : null;
				})
				.filter((r): r is { board: (typeof fleetData.fleet)[number]; next: (typeof fleetData.assignments)[number] } => r !== null)
				.sort((a, b) => a.next.startDate.localeCompare(b.next.startDate))
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

			{calendarBroken && (
				<Link href="/admin/calendar" className="admin-attention admin-attention--alert">
					<div className="admin-attention-header">
						<span className="admin-attention-kicker">
							<WarningIcon /> Calendar sync
						</span>
					</div>
					<p className="admin-attention-lead">
						{calendarHealth.stale
							? "The calendar sync hasn't succeeded recently — the nightly job may have stopped. Tap to check."
							: "The last calendar sync failed — some runs may not be on your phone. Tap to see why and retry."}
					</p>
				</Link>
			)}

			{awaitingPayment.length > 0 && (
				<article className="admin-attention admin-attention--alert">
					<div className="admin-attention-header">
						<span className="admin-attention-kicker">
							<WarningIcon /> Awaiting payment · delivery near
						</span>
						<span className="admin-attention-count">{awaitingPayment.length}</span>
					</div>
					<p className="admin-attention-lead">
						{awaitingPayment.length === 1
							? "A booking with a payment link isn't paid and its delivery is close."
							: `${awaitingPayment.length} bookings have an unpaid link with delivery close or past.`}{" "}
						Chase payment before the gear goes out.
					</p>
					<ul className="admin-today-list">
						{awaitingPayment.slice(0, 5).map((b) => (
							<TodayRow key={b.id} b={b} kind="upcoming" today={today} />
						))}
					</ul>
				</article>
			)}

			{overdueGear.length > 0 && (
				<article className="admin-attention admin-attention--alert">
					<div className="admin-attention-header">
						<span className="admin-attention-kicker">
							<WarningIcon /> Gear overdue back
						</span>
						<span className="admin-attention-count">{overdueGear.length}</span>
					</div>
					<p className="admin-attention-lead">
						{overdueGear.length === 1
							? "A booking's pickup date has passed but it's not marked complete — the gear may still be out."
							: `${overdueGear.length} bookings are past their pickup date and not marked complete.`}{" "}
						Chase the gear, or mark them completed.
					</p>
					<ul className="admin-today-list">
						{overdueGear.slice(0, 5).map((b) => (
							<TodayRow key={b.id} b={b} kind="pickup" today={today} />
						))}
					</ul>
				</article>
			)}

			{repairNeeded.length > 0 && (
				<article className="admin-attention admin-attention--alert">
					<div className="admin-attention-header">
						<span className="admin-attention-kicker">
							<WarningIcon /> Board in repair, booking coming up
						</span>
						<span className="admin-attention-count">{repairNeeded.length}</span>
					</div>
					<p className="admin-attention-lead">
						{repairNeeded.length === 1
							? "A board that's marked in repair is assigned to an upcoming booking."
							: `${repairNeeded.length} boards marked in repair are assigned to upcoming bookings.`}{" "}
						Finish the repair, or swap the board on the booking.
					</p>
					<ul className="admin-today-list">
						{repairNeeded.slice(0, 5).map(({ board, next }) => (
							<li key={board.id} className="admin-today-row">
								<Link
									href={`/admin/bookings/${next.bookingId}`}
									className="admin-today-link"
								>
									<div className="admin-today-row-left">
										<span className="admin-today-date">
											{formatShortDate(next.startDate)}
										</span>
										<span className="admin-today-name">
											{board.name} ({board.size})
										</span>
									</div>
									<div className="admin-today-row-right">
										<span className="admin-today-accommodation">
											{next.bookingName}
										</span>
										<span className="admin-status admin-status--stage-late">
											In repair
										</span>
									</div>
								</Link>
							</li>
						))}
					</ul>
				</article>
			)}

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
							<TodayRow key={b.id} b={b} kind="requested" today={today} />
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
							<TodayRow key={b.id} b={b} kind="upcoming" today={today} />
						))}
					</ul>
				</article>
			)}

			{hasVanLoad && (
				<article className="admin-card admin-van-load">
					<div className="admin-today-heading">
						<span className="admin-today-kicker">Van load · today</span>
						<span className="admin-today-count">{deliveringToday.length} stop{deliveringToday.length === 1 ? "" : "s"}</span>
					</div>
					<div className="admin-van-load-grid">
						{vanLoad.boards.length > 0 && (
							<div>
								<span className="admin-van-load-label">Boards</span>
								<span className="admin-van-load-items">{vanLoad.boards.join(" · ")}</span>
							</div>
						)}
						{vanLoad.wetsuits.length > 0 && (
							<div>
								<span className="admin-van-load-label">Wetsuits</span>
								<span className="admin-van-load-items">{vanLoad.wetsuits.join(" · ")}</span>
							</div>
						)}
						{vanLoad.extras.length > 0 && (
							<div>
								<span className="admin-van-load-label">Extras</span>
								<span className="admin-van-load-items">{vanLoad.extras.join(" · ")}</span>
							</div>
						)}
					</div>
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
								<TodayRow key={b.id} b={b} kind="delivery" today={today} />
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
								<TodayRow key={b.id} b={b} kind="pickup" today={today} />
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
							{nextSevenDays.map((run) => (
								<TodayRow
									key={`${run.b.id}-${run.kind}`}
									b={run.b}
									kind={run.kind}
									today={today}
								/>
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
						</tr>
					</thead>
					<tbody>
						{filteredBookings.map((b) => (
							<tr key={b.id} className="admin-row-clickable">
								<td>{formatShortDate(b.createdAt.toISOString().slice(0, 10))}</td>
								<td>
									{/* Stretched link makes the whole row tappable (mobile-
										first) without nesting the interactive status control
										inside an anchor. */}
									<Link
										href={`/admin/bookings/${b.id}`}
										className="admin-row-stretch"
										aria-label={`Open booking for ${b.name}`}
									/>
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
									{formatShortDate(b.checkin)}
									{b.deliveryTime ? ` ${b.deliveryTime}` : ""} →{" "}
									{formatShortDate(b.checkout)}
									{b.pickupTime ? ` ${b.pickupTime}` : ""}
								</td>
								<td>{b.peopleCount}</td>
								<td>{priceCell(b)}</td>
								<td className="admin-cell-interactive">
									{/* Tag shows the lifecycle stage, matching the stepper
										on the booking page — not the raw status enum. Kept
										above the row's stretched link so it stays tappable. */}
									<StatusPicker
										bookingId={b.id}
										current={b.status}
										hasPaymentLink={Boolean(b.stripePaymentLinkUrl)}
										paid={Boolean(b.paidAt)}
										late={isBookingLate(b, today)}
									/>
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
	today,
}: {
	b: Booking;
	kind:
		| "delivery"
		| "pickup"
		| "upcoming"
		| "upcoming-delivery"
		| "upcoming-pickup"
		| "requested";
	today: string;
}) {
	// Same vocabulary as the table tags and the booking-page stepper.
	const late = isBookingLate(b, today);
	const inputs = toStageInputs(b);
	const stage = currentStageLabel(inputs, late);
	const stageKey = currentStageKey(inputs, late);
	const isPickup = kind === "pickup" || kind === "upcoming-pickup";
	// Show a date for any upcoming/requested row; the Deliver/Pick-up chip
	// only for the two direction-specific run kinds.
	const isUpcoming =
		kind === "upcoming" ||
		kind === "upcoming-delivery" ||
		kind === "upcoming-pickup";
	const showChip = kind === "upcoming-delivery" || kind === "upcoming-pickup";
	const dateStr = isPickup
		? formatShortDate(b.checkout)
		: formatShortDate(b.checkin);
	const runTime = isPickup ? b.pickupTime : b.deliveryTime;
	return (
		<li className="admin-today-row">
			<Link
				href={`/admin/bookings/${b.id}`}
				className="admin-today-link"
			>
				<div className="admin-today-row-left">
					{(isUpcoming || kind === "requested") && (
						<span className="admin-today-date">
							{dateStr}
							{runTime ? ` ${runTime}` : ""}
						</span>
					)}
					{showChip && (
						<span
							className={`admin-run-chip admin-run-chip--${isPickup ? "pickup" : "delivery"}`}
						>
							{isPickup ? "Pick up" : "Deliver"}
						</span>
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
						{accommodationLabel(b.accommodation)}
					</span>
					<span className={`admin-status admin-status--stage-${stageKey}`}>
						{stage}
					</span>
				</div>
			</Link>
			{mapsUrl(b.accommodation) && (
				<a
					href={mapsUrl(b.accommodation)!}
					target="_blank"
					rel="noopener noreferrer"
					className="admin-today-nav"
					aria-label={`Navigate to ${b.name}`}
				>
					<ExternalIcon />
				</a>
			)}
		</li>
	);
}
