import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, schema } from "../../../lib/db/client";
import type { BookingStatus } from "../../../lib/db/schema";
import {
	updateBookingNotes,
	updateBookingStatus,
	updateFinalTotal,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUSES: BookingStatus[] = [
	"requested",
	"confirmed",
	"cancelled",
	"completed",
];

function formatDate(dateStr: string): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) return dateStr;
	return d.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export default async function BookingDetailPage({
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
				<p>Set <code>DATABASE_URL</code> to view booking details.</p>
			</section>
		);
	}

	const [booking] = await db
		.select()
		.from(schema.bookings)
		.where(eq(schema.bookings.id, id))
		.limit(1);

	if (!booking) notFound();

	return (
		<section className="admin-detail">
			<Link href="/admin" className="admin-back">
				← All bookings
			</Link>

			<header className="admin-detail-header">
				<h1>
					{booking.name} <span className="admin-detail-id">#{booking.id}</span>
				</h1>
				<p className="admin-detail-email">
					<a href={`mailto:${booking.email}`}>{booking.email}</a>
				</p>
			</header>

			<div className="admin-detail-grid">
				<article className="admin-card">
					<h2>Trip</h2>
					<dl className="admin-dl">
						<dt>Delivery</dt>
						<dd>{formatDate(booking.checkin)}</dd>
						<dt>Pickup</dt>
						<dd>{formatDate(booking.checkout)}</dd>
						<dt>Accommodation</dt>
						<dd>{booking.accommodation || "—"}</dd>
						<dt>People</dt>
						<dd>{booking.peopleCount}</dd>
						<dt>Estimate</dt>
						<dd>
							{booking.estimatedTotal != null
								? `€${booking.estimatedTotal}`
								: "—"}
						</dd>
						<dt>Submitted</dt>
						<dd>{formatDate(booking.createdAt.toISOString())}</dd>
					</dl>
				</article>

				<article className="admin-card">
					<h2>Status</h2>
					<form
						action={async (formData: FormData) => {
							"use server";
							const next = formData.get("status") as BookingStatus;
							await updateBookingStatus(id, next);
						}}
					>
						<select
							name="status"
							defaultValue={booking.status}
							className="admin-status-select"
						>
							{STATUSES.map((s) => (
								<option key={s} value={s}>
									{s.charAt(0).toUpperCase() + s.slice(1)}
								</option>
							))}
						</select>
						<button type="submit" className="admin-btn admin-btn--primary">
							Update status
						</button>
					</form>

					<h3>Final price (€)</h3>
					<form
						action={async (formData: FormData) => {
							"use server";
							const raw = formData.get("finalTotal") as string;
							const value = raw ? Number.parseInt(raw, 10) : null;
							await updateFinalTotal(id, value);
						}}
					>
						<input
							type="number"
							name="finalTotal"
							defaultValue={booking.finalTotal ?? ""}
							placeholder={booking.estimatedTotal?.toString() ?? ""}
							className="admin-input"
						/>
						<button type="submit" className="admin-btn">
							Save final price
						</button>
					</form>
				</article>
			</div>

			{booking.people && booking.people.length > 0 && (
				<article className="admin-card">
					<h2>People</h2>
					<div className="admin-people">
						{booking.people.map((p, i) => (
							<div key={i} className="admin-person">
								<div className="admin-person-name">{p.name || `Person ${i + 1}`}</div>
								<dl className="admin-dl admin-dl--inline">
									<dt>Sex</dt>
									<dd>{p.sex || "—"}</dd>
									<dt>Experience</dt>
									<dd>{p.experience || "—"}</dd>
									<dt>Package</dt>
									<dd>{p.package || "—"}</dd>
									<dt>Board</dt>
									<dd>{p.board || "—"}</dd>
									<dt>Wetsuit</dt>
									<dd>{p.wetsuitSize || "—"}</dd>
								</dl>
							</div>
						))}
					</div>
				</article>
			)}

			{booking.message && (
				<article className="admin-card">
					<h2>Customer message</h2>
					<p className="admin-message">{booking.message}</p>
				</article>
			)}

			<article className="admin-card">
				<h2>Owner notes</h2>
				<form
					action={async (formData: FormData) => {
						"use server";
						const notes = formData.get("ownerNotes") as string;
						await updateBookingNotes(id, notes);
					}}
				>
					<textarea
						name="ownerNotes"
						defaultValue={booking.ownerNotes ?? ""}
						rows={4}
						className="admin-textarea"
						placeholder="Private notes, follow-ups, payment reminders..."
					/>
					<button type="submit" className="admin-btn">
						Save notes
					</button>
				</form>
			</article>
		</section>
	);
}
