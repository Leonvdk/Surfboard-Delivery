import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, schema } from "../../../lib/db/client";
import { updateBookingNotes, updateFinalTotal } from "../../_actions";
import { StatusPicker } from "../../_components/status-picker";
import {
	boardLabel,
	experienceLabel,
	packageShort,
	sexLabel,
	summariseGear,
} from "../../_lib/booking-labels";

export const dynamic = "force-dynamic";

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
					<p className="admin-card-hint">Click the badge to change.</p>
					<StatusPicker bookingId={id} current={booking.status} />

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

			{(() => {
				const gear = summariseGear(booking.people ?? null);
				if (gear) {
					return (
						<article className="admin-card">
							<h2>Gear</h2>
							<div className="gear-summary">
								<div className="gear-group">
									<div className="gear-group-label">Packages</div>
									<ul className="gear-list">
										{gear.packages.map((row) => (
											<li key={row.label}>
												<span className="gear-count">{row.count}×</span>{" "}
												{row.label}
											</li>
										))}
									</ul>
								</div>
								{gear.boards.length > 0 && (
									<div className="gear-group">
										<div className="gear-group-label">Boards</div>
										<ul className="gear-list">
											{gear.boards.map((row) => (
												<li key={row.label}>
													<span className="gear-count">{row.count}×</span>{" "}
													{row.label}
												</li>
											))}
										</ul>
									</div>
								)}
								{gear.wetsuits.length > 0 && (
									<div className="gear-group">
										<div className="gear-group-label">Wetsuits</div>
										<ul className="gear-list">
											{gear.wetsuits.map((row) => (
												<li key={row.label}>
													<span className="gear-count">{row.count}×</span>{" "}
													{row.label}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>

							<h3>Per person</h3>
							<div className="admin-people">
								{booking.people!.map((p, i) => (
									<div key={i} className="admin-person">
										<div className="admin-person-name">
											{p.name || `Person ${i + 1}`}
										</div>
										<dl className="admin-dl admin-dl--inline">
											<dt>Sex</dt>
											<dd>{sexLabel(p.sex)}</dd>
											<dt>Experience</dt>
											<dd>{experienceLabel(p.experience)}</dd>
											<dt>Package</dt>
											<dd>{packageShort(p.package)}</dd>
											<dt>Board</dt>
											<dd>{boardLabel(p.board)}</dd>
											<dt>Wetsuit</dt>
											<dd>{p.wetsuitSize || "—"}</dd>
										</dl>
									</div>
								))}
							</div>
						</article>
					);
				}
				// No per-person breakdown — imported bookings pre-parser change.
				return (
					<article className="admin-card">
						<h2>Gear</h2>
						<p className="admin-empty-inline">
							Per-person breakdown isn&apos;t stored for this booking.
							{booking.importedFromResend
								? " It was imported from an email before the parser recorded gear details — re-run the import script with --reparse to fill it in."
								: ""}
						</p>
					</article>
				);
			})()}

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
