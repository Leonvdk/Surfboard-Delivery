import { desc } from "drizzle-orm";
import Link from "next/link";
import { getDb, schema } from "../lib/db/client";
import type { BookingStatus } from "../lib/db/schema";

export const dynamic = "force-dynamic";

const STATUS_COPY: Record<BookingStatus, { label: string; className: string }> = {
	requested: { label: "Requested", className: "admin-status admin-status--requested" },
	confirmed: { label: "Confirmed", className: "admin-status admin-status--confirmed" },
	cancelled: { label: "Cancelled", className: "admin-status admin-status--cancelled" },
	completed: { label: "Completed", className: "admin-status admin-status--completed" },
};

function formatDate(dateStr: string): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) return dateStr;
	return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminBookingsPage() {
	const db = getDb();

	if (!db) {
		return (
			<section className="admin-empty">
				<h1>Database not configured</h1>
				<p>Set <code>DATABASE_URL</code> in Vercel and run migrations to start seeing bookings.</p>
			</section>
		);
	}

	const bookings = await db
		.select()
		.from(schema.bookings)
		.orderBy(desc(schema.bookings.createdAt))
		.limit(200);

	const counts = bookings.reduce(
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
				<div className="admin-page-summary">
					<span>{bookings.length} total</span>
					<span>{counts.requested ?? 0} requested</span>
					<span>{counts.confirmed ?? 0} confirmed</span>
					<span>{counts.completed ?? 0} completed</span>
					<span>{counts.cancelled ?? 0} cancelled</span>
				</div>
			</header>

			{bookings.length === 0 && (
				<p className="admin-empty-inline">No bookings yet. They&apos;ll appear here as customers submit the contact form.</p>
			)}

			<div className="admin-table-wrap">
				<table className="admin-table">
					<thead>
						<tr>
							<th>Received</th>
							<th>Customer</th>
							<th>Dates</th>
							<th>People</th>
							<th>Estimate</th>
							<th>Status</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{bookings.map((b) => (
							<tr key={b.id}>
								<td>{formatDate(b.createdAt.toISOString())}</td>
								<td>
									<div className="admin-cell-strong">{b.name}</div>
									<div className="admin-cell-muted">{b.email}</div>
								</td>
								<td>
									{formatDate(b.checkin)} → {formatDate(b.checkout)}
								</td>
								<td>{b.peopleCount}</td>
								<td>{b.finalTotal != null ? `€${b.finalTotal}` : b.estimatedTotal != null ? `~€${b.estimatedTotal}` : "—"}</td>
								<td>
									<span className={STATUS_COPY[b.status].className}>
										{STATUS_COPY[b.status].label}
									</span>
								</td>
								<td>
									<Link href={`/admin/bookings/${b.id}`} className="admin-row-link">
										Open →
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
