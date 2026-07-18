import { and, gte, lte, or } from "drizzle-orm";
import Link from "next/link";
import { getDb, schema } from "../../lib/db/client";
import type { Booking, BookingStatus } from "../../lib/db/schema";

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
	cancelled: "cal-chip--cancelled",
	completed: "cal-chip--completed",
};

function bookingSpansDay(b: Booking, iso: string): boolean {
	return b.checkin <= iso && iso <= b.checkout;
}

export default async function AdminCalendarPage({ searchParams }: Props) {
	const params = await searchParams;
	const { year, month } = parseMonthParam(params.month);

	const monthStart = `${year}-${pad(month)}-01`;
	const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
	const monthEnd = `${nextMonth.y}-${pad(nextMonth.m)}-01`;

	const db = getDb();
	if (!db) {
		return (
			<section className="admin-empty">
				<h1>Database not configured</h1>
				<p>Set <code>DATABASE_URL</code> to see the calendar.</p>
			</section>
		);
	}

	// Bookings whose window overlaps the calendar's month
	const bookings = await db
		.select()
		.from(schema.bookings)
		.where(
			and(
				or(
					gte(schema.bookings.checkin, monthStart),
					lte(schema.bookings.checkin, monthEnd),
				),
				or(
					gte(schema.bookings.checkout, monthStart),
					lte(schema.bookings.checkout, monthEnd),
				),
			),
		);

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
				<span className="cal-chip cal-chip--completed">Completed</span>
				<span className="cal-chip cal-chip--cancelled">Cancelled</span>
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
									{dayBookings.slice(0, 3).map((b) => (
										<Link
											key={b.id}
											href={`/admin/bookings/${b.id}`}
											className={`cal-chip ${STATUS_CLASS[b.status]}`}
										>
											{b.name.split(" ")[0]} · {b.peopleCount}p
										</Link>
									))}
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
		</section>
	);
}
