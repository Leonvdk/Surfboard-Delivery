import Link from "next/link";
import type { Booking, BookingStatus } from "../../lib/db/schema";
import { getCachedBookings } from "../_lib/bookings-cache";
import { blockingAssignments, getCachedFleet } from "../_lib/boards-cache";
import { CalendarSubscribe } from "../_components/calendar-subscribe";
import { CalendarSyncNow } from "../_components/calendar-sync-now";
import { WarningIcon, CheckIcon } from "../_components/icons";
import { BRAND_COLOR } from "../../lib/ics";
import { getSyncHealth, type SyncHealth } from "../../lib/google-calendar";

export const dynamic = "force-dynamic";

interface Props {
	searchParams: Promise<{ month?: string }>;
}

function parseMonthParam(param: string | undefined): { year: number; month: number } {
	if (param && /^\d{4}-\d{2}$/.test(param)) {
		const [y, m] = param.split("-").map(Number);
		if (y && m && m >= 1 && m <= 12) return { year: y, month: m };
	}
	const now = new Date();
	return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function pad(n: number): string {
	return n < 10 ? `0${n}` : `${n}`;
}

const STATUS_CLASS: Record<BookingStatus, string> = {
	requested: "cal-chip--requested",
	confirmed: "cal-chip--confirmed",
	in_progress: "cal-chip--in_progress",
	cancelled: "cal-chip--cancelled",
	completed: "cal-chip--completed",
};

function bookingSpansDay(b: Booking, iso: string): boolean {
	return b.checkin <= iso && iso <= b.checkout;
}

function EdgeMarker({ kind }: { kind: "delivery" | "pickup" }) {
	// Inline SVG so iOS Safari doesn't render triangle chars (▶ ◀) as color
	// emoji — those glyphs break the flat black-and-orange brand look.
	const points =
		kind === "delivery" ? "1,1 8,4.5 1,8" : "8,1 1,4.5 8,8";
	return (
		<svg
			width={9}
			height={9}
			viewBox="0 0 9 9"
			className="cal-chip-marker"
			aria-hidden="true"
		>
			<polygon points={points} fill="currentColor" />
		</svg>
	);
}

export default async function AdminCalendarPage({ searchParams }: Props) {
	const params = await searchParams;
	const { year, month } = parseMonthParam(params.month);

	const monthStart = `${year}-${pad(month)}-01`;
	const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
	const monthEnd = `${nextMonth.y}-${pad(nextMonth.m)}-01`;

	const allBookings = await getCachedBookings();
	if (!allBookings) {
		return (
			<section className="admin-empty">
				<h1>Database not configured</h1>
				<p>Set <code>DATABASE_URL</code> to see the calendar.</p>
			</section>
		);
	}

	// Bookings whose window overlaps the calendar's month, filtered in JS
	// over the shared cached dataset. (The old SQL or() month filter was a
	// tautology that matched every row anyway — this is both faster and
	// actually correct.)
	const bookings = allBookings.filter(
		(b) => !(b.checkout < monthStart || b.checkin >= monthEnd),
	);

	// Fleet availability strip data: active boards + their busy windows
	// clipped to this month.
	const fleetData = await getCachedFleet();
	const activeFleet = (fleetData?.fleet ?? []).filter(
		(b) => b.kind === "board" && b.status === "active",
	);
	const busyByBoard = new Map<number, Array<{ start: string; end: string; bookingId: number; bookingName: string }>>();
	if (fleetData) {
		for (const a of blockingAssignments(fleetData.assignments)) {
			if (a.endDate < monthStart || a.startDate >= monthEnd) continue;
			const list = busyByBoard.get(a.boardId) ?? [];
			list.push({
				start: a.startDate,
				end: a.endDate,
				bookingId: a.bookingId,
				bookingName: a.bookingName,
			});
			busyByBoard.set(a.boardId, list);
		}
	}

	// Build the day grid (Monday-first weeks)
	const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
	const jsWeekday = firstOfMonth.getUTCDay(); // 0=Sun
	const leadingBlanks = (jsWeekday + 6) % 7; // Convert so Monday=0
	const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
	const cells: Array<{ iso: string; day: number } | null> = [];
	for (let i = 0; i < leadingBlanks; i++) cells.push(null);
	for (let d = 1; d <= daysInMonth; d++) {
		cells.push({ iso: `${year}-${pad(month)}-${pad(d)}`, day: d });
	}
	while (cells.length % 7 !== 0) cells.push(null);

	const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
		"en-GB",
		{ month: "long", year: "numeric", timeZone: "UTC" },
	);
	const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
	const next = nextMonth;

	return (
		<section className="admin-calendar-page">
			<header className="admin-page-header">
				<h1>{monthLabel}</h1>
				<div className="admin-cal-controls">
					<Link href={`/admin/calendar?month=${prev.y}-${pad(prev.m)}`}>
						← {new Date(Date.UTC(prev.y, prev.m - 1, 1)).toLocaleDateString("en-GB", { month: "short" })}
					</Link>
					<Link href={`/admin/calendar`}>Today</Link>
					<Link href={`/admin/calendar?month=${next.y}-${pad(next.m)}`}>
						{new Date(Date.UTC(next.y, next.m - 1, 1)).toLocaleDateString("en-GB", { month: "short" })} →
					</Link>
				</div>
			</header>

			<div className="admin-cal-legend">
				<span className="cal-chip cal-chip--requested">Requested</span>
				<span className="cal-chip cal-chip--confirmed">Confirmed</span>
				<span className="cal-chip cal-chip--in_progress">In progress</span>
				<span className="cal-chip cal-chip--completed">Completed</span>
				<span className="cal-chip cal-chip--cancelled">Cancelled</span>
				<span className="cal-chip cal-chip--legend-marker">
					<EdgeMarker kind="delivery" /> delivery ·{" "}
					<EdgeMarker kind="pickup" /> pickup
				</span>
			</div>

			<div className="admin-cal-grid">
				<div className="admin-cal-weekdays">
					{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
						<div key={w} className="admin-cal-weekday">{w}</div>
					))}
				</div>
				<div className="admin-cal-cells">
					{cells.map((cell, idx) => {
						if (!cell) return <div key={idx} className="admin-cal-cell admin-cal-cell--blank" />;
						const dayBookings = bookings.filter((b) => bookingSpansDay(b, cell.iso));
						return (
							<div key={cell.iso} className="admin-cal-cell">
								<div className="admin-cal-day">{cell.day}</div>
								<div className="admin-cal-events">
									{dayBookings.slice(0, 3).map((b) => {
										const isDelivery = b.checkin === cell.iso;
										const isPickup = b.checkout === cell.iso;
										return (
											<Link
												key={b.id}
												href={`/admin/bookings/${b.id}`}
												className={`cal-chip ${STATUS_CLASS[b.status]}${isDelivery || isPickup ? " cal-chip--edge" : ""}`}
												title={b.ownerNotes ? `Note: ${b.ownerNotes.slice(0, 200)}` : undefined}
											>
												{isDelivery && <EdgeMarker kind="delivery" />}
												{isPickup && <EdgeMarker kind="pickup" />}
												{b.name.split(" ")[0]} · {b.peopleCount}p
												{b.ownerNotes ? (
													<span
														className="cal-chip-note"
														aria-hidden="true"
													/>
												) : null}
											</Link>
										);
									})}
									{dayBookings.length > 3 && (
										<span className="cal-chip cal-chip--more">
											+{dayBookings.length - 3} more
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{activeFleet.length > 0 && (
				<div className="admin-board-strip">
					<div className="admin-list-heading">
						<h2>Board availability</h2>
					</div>
					<div className="admin-board-strip-scroll">
						<table className="admin-board-strip-table">
							<thead>
								<tr>
									<th className="admin-board-strip-name" />
									{Array.from({ length: daysInMonth }, (_, i) => (
										<th key={i + 1} className="admin-board-strip-day">
											{i + 1}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{activeFleet.map((board) => {
									const busy = busyByBoard.get(board.id) ?? [];
									return (
										<tr key={board.id}>
											<td className="admin-board-strip-name">
												<Link
													href={`/admin/boards/${board.id}`}
													className="admin-row-link"
												>
													{board.name}
												</Link>
											</td>
											{Array.from({ length: daysInMonth }, (_, i) => {
												const iso = `${year}-${pad(month)}-${pad(i + 1)}`;
												const hit = busy.find(
													(w) => w.start <= iso && iso <= w.end,
												);
												return hit ? (
													<td
														key={iso}
														className="admin-board-strip-cell admin-board-strip-cell--busy"
														title={`${hit.bookingName} · #${hit.bookingId}`}
													/>
												) : (
													<td key={iso} className="admin-board-strip-cell" />
												);
											})}
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<p className="admin-card-hint">
						Orange = out on a booking. Hover a bar for the booking. Repair /
						retired boards aren&apos;t shown.
					</p>
				</div>
			)}

			<CalendarFeedCard />
		</section>
	);
}

/** Relative "2 minutes ago" from a timestamp, for the health line. */
function ago(date: Date | null): string {
	if (!date) return "never";
	const s = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
	if (s < 60) return "just now";
	if (s < 3600) return `${Math.floor(s / 60)}m ago`;
	if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
	return `${Math.floor(s / 86400)}d ago`;
}

/**
 * The one-line health readout. This is the anti-silent-failure surface:
 * green when the last run succeeded recently, red the moment it fails or
 * goes stale (the cron stopped firing), with the actual error shown.
 */
function CalendarSyncStatusLine({ health }: { health: SyncHealth }) {
	const { status, stale } = health;
	if (!status || !status.lastRunAt) {
		return (
			<p className="admin-sync-status admin-sync-status--warn">
				<WarningIcon /> Never run yet. Tap <strong>Sync now</strong> to push
				existing bookings and confirm the connection.
			</p>
		);
	}
	const healthy = status.ok && !stale;
	if (healthy) {
		return (
			<p className="admin-sync-status admin-sync-status--ok">
				<CheckIcon /> Last synced {ago(status.lastRunAt)} · {status.bookings}{" "}
				booking{status.bookings === 1 ? "" : "s"} in sync.
			</p>
		);
	}
	return (
		<p className="admin-sync-status admin-sync-status--warn">
			<WarningIcon />{" "}
			{stale
				? `No successful sync since ${ago(status.lastSuccessAt)} — the nightly job may have stopped. `
				: `Last sync failed (${ago(status.lastRunAt)})${status.consecutiveFailures > 1 ? `, ${status.consecutiveFailures} in a row` : ""}. `}
			{status.lastError ? <span className="admin-cell-muted">{status.lastError}</span> : null}
		</p>
	);
}

/**
 * The subscribe URL for the hello@ Google Calendar. The token IS the
 * auth — Google can't send headers when polling a subscribed feed — so
 * this only renders behind the admin session, and says as much.
 */
async function CalendarFeedCard() {
	const token = process.env.CALENDAR_FEED_TOKEN;
	const site =
		process.env.NEXT_PUBLIC_SITE_URL ?? "https://surfrental-aljezur.com";

	const health = await getSyncHealth();
	const directSync = health.configured;

	return (
		<article className="admin-card">
			<h2>Calendar sync</h2>
			{directSync ? (
				<>
					<p className="admin-card-hint">
						<strong>Direct sync is on.</strong> Delivery and collection runs are
						written straight into {process.env.GOOGLE_CALENDAR_ID} as real
						events, so they appear in Notion Calendar, Apple Calendar and
						anywhere else that account syncs — within seconds, not hours. They
						update when you change a booking and disappear when you cancel one.
					</p>
					<CalendarSyncStatusLine health={health} />
					<CalendarSyncNow />
				</>
			) : (
				<p className="admin-card-hint">
					Direct sync is off. Set GOOGLE_CALENDAR_ID,
					GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY in
					Vercel to write real events into the hello@ calendar. Until then
					the subscribable feed below is the only option — note that Google
					polls feeds slowly and Apple Calendar can&apos;t see them through a
					Google account at all.
				</p>
			)}
			<h3 className="admin-modal-section">Or subscribe to the feed</h3>
			{token ? (
				<CalendarSubscribe
					feedUrl={`${site}/api/calendar/${token}/runs.ics`}
					brandColor={BRAND_COLOR}
				/>
			) : (
				<p className="admin-empty-inline">
					Set <code>CALENDAR_FEED_TOKEN</code> in the Vercel environment to a
					long random string, redeploy, and the subscribe link appears here.
				</p>
			)}
		</article>
	);
}
