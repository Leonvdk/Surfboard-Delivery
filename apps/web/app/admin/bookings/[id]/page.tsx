import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../lib/db/client";
import { updateBookingNotes, updateFinalTotal } from "../../_actions";
import {
	addPayment,
	linkStripeCharge,
	removePayment,
	settleBooking,
} from "../../_payment-actions";
import { listUnassignedCharges } from "../../_lib/stripe-charges";
import { eur } from "../../_lib/revenue-metrics";
import {
	accommodationLabel,
	deliveryMessages,
	mapsUrl,
	waUrl,
} from "../../_lib/links";
import { DeleteBookingButton } from "../../_components/delete-booking-button";
import { QuickStatusButtons } from "../../_components/quick-status-buttons";
import { StatusPicker } from "../../_components/status-picker";
import {
	boardLabel,
	experienceLabel,
	packageShort,
	sexLabel,
	summariseGear,
} from "../../_lib/booking-labels";
import { BoardAssignmentPanel } from "../../_components/board-assignment";
import { BookingEditSendButton } from "../../_components/booking-edit-send";
import { CopyHandoverButton } from "../../_components/copy-handover-button";
import { getAddonTariff } from "../../../lib/pricing";
import type { Booking } from "../../../lib/db/schema";
import type { FleetData } from "../../_lib/boards-cache";
import { BookingProgress } from "../../_components/booking-progress";
import { ExtraGearPanel } from "../../_components/extra-gear";
import { CheckIcon, EuroIcon, ExternalIcon, RepeatIcon, SplitDatesIcon, WarningIcon } from "../../_components/icons";
import { getCachedBookings } from "../../_lib/bookings-cache";
import { getCachedFleet } from "../../_lib/boards-cache";
import { isBookingLate } from "../../_lib/booking-stage";
import { computeCancellationState } from "../../_lib/cancellation";
import { formatLongDate, formatShortDate, todayIso } from "../../_lib/dates";
import { getRepeatCustomer } from "../../_lib/repeat-customer";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ boardError?: string }>;
}) {
	const { id: idStr } = await params;
	const { boardError } = await searchParams;
	const id = Number.parseInt(idStr, 10);
	if (Number.isNaN(id)) notFound();

	const allBookings = await getCachedBookings();
	if (!allBookings) {
		return (
			<section className="admin-empty">
				<h1>Database not configured</h1>
				<p>Set <code>DATABASE_URL</code> to view booking details.</p>
			</section>
		);
	}

	const booking = allBookings.find((b) => b.id === id);
	if (!booking) notFound();

	const repeat = getRepeatCustomer(allBookings, booking.id, booking.email);
	const fleetData = await getCachedFleet();

	// Payment ledger for this booking (card via Stripe, cash on delivery,
	// splits, upsells). Sums to what's been collected; billed − paid = owed.
	const paymentsDb = getDb();
	const bookingPayments = paymentsDb
		? await paymentsDb
				.select()
				.from(schema.bookingPayments)
				.where(eq(schema.bookingPayments.bookingId, booking.id))
				.orderBy(schema.bookingPayments.createdAt)
		: [];
	const billedCents = Math.round(
		(booking.finalTotal ?? booking.estimatedTotal ?? 0) * 100,
	);
	const paidCents = bookingPayments.reduce((s, p) => s + p.amountCents, 0);
	const owedCents = Math.max(0, billedCents - paidCents);

	// Orphan Stripe charges (ad-hoc payment links made before bookingId
	// metadata existed) that no booking has claimed — offered for one-tap
	// linking below. Cross-referenced against every recorded charge key so a
	// charge already on another booking never shows here.
	const assignedRows = paymentsDb
		? await paymentsDb
				.select({ key: schema.bookingPayments.stripeChargeId })
				.from(schema.bookingPayments)
		: [];
	const assignedKeys = new Set(
		assignedRows.map((r) => r.key).filter((k): k is string => Boolean(k)),
	);
	const unassignedCharges = await listUnassignedCharges(assignedKeys);
	const cancellationState =
		booking.status === "requested"
			? computeCancellationState(booking.createdAt, booking.checkin)
			: null;

	return (
		<section className="admin-detail">
			<Link href="/admin" className="admin-back">
				← All bookings
			</Link>

			<header className="admin-detail-header">
				<h1>
					{booking.name}{" "}
					<span className="admin-detail-id">#{booking.id}</span>
				</h1>
				<p className="admin-detail-email">
					<a href={`mailto:${booking.email}`}>{booking.email}</a>
				</p>
				{booking.phone && (
					<p className="admin-detail-phone">
						<a
							href={`https://wa.me/${booking.phone.replace(/[^\d]/g, "")}`}
							target="_blank"
							rel="noopener noreferrer"
							className="admin-whatsapp-link"
						>
							<svg width="15" height="15" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
								<path d="M16.003 3C9.373 3 3.998 8.375 3.998 15.006c0 2.117.556 4.184 1.61 6.005L4 29l8.198-2.148a12.03 12.03 0 0 0 3.805.62h.005c6.63 0 12.005-5.376 12.005-12.006C28.013 8.375 22.632 3 16.003 3z" />
							</svg>
							{booking.phone} · WhatsApp
						</a>
					</p>
				)}
				{booking.phone && (
					<div className="admin-quick-msgs">
						{deliveryMessages(booking.name).map((m) => {
							const u = waUrl(booking.phone, m.text);
							return u ? (
								<a
									key={m.label}
									href={u}
									target="_blank"
									rel="noopener noreferrer"
									className="admin-chip-link"
								>
									{m.label}
								</a>
							) : null;
						})}
					</div>
				)}
				{repeat && repeat.priorCount > 0 && (
					<p className="admin-detail-repeat">
						<RepeatIcon /> <strong>Repeat customer</strong> — {repeat.priorCount + 1}
						{ordinalSuffix(repeat.priorCount + 1)} trip
						{repeat.lastCheckin
							? ` · previous: ${formatShortDate(repeat.lastCheckin)}`
							: ""}
					</p>
				)}
			</header>

			<BookingProgress booking={booking} />

			<div className="admin-detail-actions">
				<QuickStatusButtons bookingId={id} current={booking.status} />
				<BookingEditSendButton booking={booking} />
				<CopyHandoverButton text={buildHandover(booking, fleetData)} />
			</div>

			{boardError && (
				<div className="admin-board-error" role="alert">
					<WarningIcon /> {boardError}
				</div>
			)}

			<div className="admin-detail-grid">
				<article className="admin-card">
					<h2>Trip</h2>
					{booking.people?.some((p) => p.checkin || p.checkout) && (
						<p className="admin-stagger-badge">
							<SplitDatesIcon /> Staggered dates — some people have their own delivery/pickup window (see Per person below).
						</p>
					)}
					<dl className="admin-dl">
						<dt>Delivery (envelope)</dt>
						<dd>
							{formatLongDate(booking.checkin)}
							{booking.deliveryTime ? (
								<strong className="admin-run-time"> · {booking.deliveryTime}</strong>
							) : (
								<span className="admin-cell-muted"> · no time set</span>
							)}
						</dd>
						<dt>Pickup (envelope)</dt>
						<dd>
							{formatLongDate(booking.checkout)}
							{booking.pickupTime ? (
								<strong className="admin-run-time"> · {booking.pickupTime}</strong>
							) : (
								<span className="admin-cell-muted"> · no time set</span>
							)}
						</dd>
						<dt>Accommodation</dt>
						<dd className="admin-accommodation-cell">
							{accommodationLabel(booking.accommodation)}
							{mapsUrl(booking.accommodation) && (
								<a
									href={mapsUrl(booking.accommodation)!}
									target="_blank"
									rel="noopener noreferrer"
									className="admin-nav-link"
								>
									<ExternalIcon /> Navigate
								</a>
							)}
						</dd>
						<dt>People</dt>
						<dd>{booking.peopleCount}</dd>
						{booking.finalTotal != null ? (
							<>
								<dt>Final price</dt>
								<dd>€{booking.finalTotal}</dd>
							</>
						) : (
							<>
								<dt>Estimate</dt>
								<dd>
									{booking.estimatedTotal != null
										? `€${booking.estimatedTotal}`
										: "—"}
								</dd>
							</>
						)}
						{booking.stripePaymentLinkUrl && (
							<>
								<dt>Payment link</dt>
								<dd>
									<a
										href={booking.stripePaymentLinkUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="admin-row-link"
									>
										Open Stripe link →
									</a>
								</dd>
							</>
						)}
						{booking.confirmationSentAt && (
							<>
								<dt>Confirmation email</dt>
								<dd>
									<CheckIcon /> Sent{" "}
									{booking.confirmationSentAt.toLocaleString("en-GB", {
										day: "numeric",
										month: "short",
										hour: "2-digit",
										minute: "2-digit",
									})}
									<div className="admin-cell-muted">
										Copy in {"hello@surfrental-aljezur.com"}
										{booking.confirmationEmailId
											? ` · id ${booking.confirmationEmailId.slice(0, 8)}`
											: ""}
									</div>
								</dd>
							</>
						)}
						<dt>Payment</dt>
						<dd>
							<EuroIcon /> {eur(paidCents)} of {eur(billedCents)} paid
							{owedCents > 0 ? (
								<span className="admin-cell-muted"> · {eur(owedCents)} owed</span>
							) : billedCents > 0 ? (
								<span className="admin-paid-badge"> · settled</span>
							) : null}
						</dd>
						<dt>Submitted</dt>
						<dd>
							{booking.createdAt.toLocaleDateString("en-GB", {
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
						</dd>
					</dl>
				</article>

				<article className="admin-card">
					<h2>Status</h2>
					<p className="admin-card-hint">Click the badge to change.</p>
					<StatusPicker
						bookingId={id}
						current={booking.status}
						hasPaymentLink={Boolean(booking.stripePaymentLinkUrl)}
						paid={Boolean(booking.paidAt)}
						late={isBookingLate(booking, todayIso())}
					/>

					{cancellationState && (
						<div
							className={`cancellation-badge cancellation-badge--${cancellationState.phase}`}
						>
							<div className="cancellation-badge-label">
								{cancellationState.label}
							</div>
							<div className="cancellation-badge-detail">
								{cancellationState.detail}
							</div>
						</div>
					)}

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
								{gear.packages.map((pkg) => (
									<section key={pkg.key} className="gear-package">
										<header className="gear-package-header">
											<span className="gear-count">{pkg.count}×</span>
											<span className="gear-package-label">{pkg.label}</span>
										</header>
										{(pkg.boards.length > 0 || pkg.wetsuits.length > 0) && (
											<div className="gear-package-children">
												{pkg.boards.length > 0 && (
													<div className="gear-group">
														<div className="gear-group-label">Boards</div>
														<ul className="gear-list">
															{pkg.boards.map((row) => (
																<li key={row.label}>
																	<span className="gear-count">
																		{row.count}×
																	</span>{" "}
																	{row.label}
																</li>
															))}
														</ul>
													</div>
												)}
												{pkg.wetsuits.length > 0 && (
													<div className="gear-group">
														<div className="gear-group-label">Wetsuits</div>
														<ul className="gear-list">
															{pkg.wetsuits.map((row) => (
																<li key={row.label}>
																	<span className="gear-count">
																		{row.count}×
																	</span>{" "}
																	{row.label}
																</li>
															))}
														</ul>
													</div>
												)}
											</div>
										)}
									</section>
								))}
							</div>

							<h3>Per person</h3>
							<div className="admin-people">
								{booking.people?.map((p, i) => {
									const hasOwnDates = Boolean(p.checkin && p.checkout);
									return (
										<div key={i} className="admin-person">
											<div className="admin-person-name">
												{p.name || `Person ${i + 1}`}
												{hasOwnDates && (
													<span className="admin-person-custom-dates">custom dates</span>
												)}
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
												{/* Always show this person's window. Leaving it blank
													meant reading the envelope as theirs, which for a
													staggered party is the whole span, not their gear. */}
												<dt>Delivery</dt>
												<dd>
													{formatLongDate(p.checkin ?? booking.checkin)}
													{!hasOwnDates && (
														<span className="admin-cell-muted"> · booking window</span>
													)}
												</dd>
												<dt>Pickup</dt>
												<dd>
													{formatLongDate(p.checkout ?? booking.checkout)}
													{!hasOwnDates && (
														<span className="admin-cell-muted"> · booking window</span>
													)}
												</dd>
											</dl>
											{fleetData && (
												<BoardAssignmentPanel
													booking={booking}
													person={p}
													personIndex={i}
													data={fleetData}
												/>
											)}
										</div>
									);
								})}
							</div>
						</article>
					);
				}
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

			{fleetData && <ExtraGearPanel booking={booking} data={fleetData} />}

			<article className="admin-card">
				<h2>Payments</h2>
				<p className="admin-card-hint">
					{eur(paidCents)} collected of {eur(billedCents)} billed
					{owedCents > 0 ? ` · ${eur(owedCents)} still owed` : " · settled"}.
					Card payments land here automatically from Stripe; add cash, a
					transfer, or an upsell below — splits are fine.
				</p>

				{billedCents === 0 && (
					<p className="admin-card-hint admin-sync-status--warn">
						No final price set — so &ldquo;billed&rdquo; is €0 and this booking
						won&apos;t show in revenue. Set the final price under{" "}
						<strong>Status → Final price</strong> first, then record what was
						paid here.
					</p>
				)}

				{bookingPayments.length > 0 && (
					<div className="admin-table-wrap">
						<table className="admin-table">
							<thead>
								<tr>
									<th>Date</th>
									<th>Method</th>
									<th>Note</th>
									<th>Amount</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{bookingPayments.map((p) => (
									<tr key={p.id}>
										<td>{formatShortDate(p.createdAt.toISOString().slice(0, 10))}</td>
										<td style={{ textTransform: "capitalize" }}>{p.method}</td>
										<td>{p.note ?? "—"}</td>
										<td>{eur(p.amountCents)}</td>
										<td>
											<form action={removePayment.bind(null, p.id, booking.id)}>
												<button type="submit" className="admin-board-remove" aria-label="Remove payment">
													delete
												</button>
											</form>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<form action={addPayment.bind(null, booking.id)} className="admin-board-form admin-expense-form">
					<div className="admin-board-form-grid">
						<label>
							Amount (€)
							<input
								type="number"
								name="amount"
								required
								min="1"
								step="0.01"
								defaultValue={owedCents > 0 ? owedCents / 100 : ""}
								className="admin-input"
							/>
						</label>
						<label>
							Method
							<select name="method" className="admin-input" defaultValue="cash">
								<option value="cash">Cash</option>
								<option value="card">Card</option>
								<option value="other">Other</option>
							</select>
						</label>
						<label>
							Note (optional)
							<input type="text" name="note" placeholder="e.g. roof-rack upsell" className="admin-input" />
						</label>
					</div>
					<button type="submit" className="admin-btn">Add payment</button>
				</form>

				{owedCents > 0 && (
					<div className="admin-mark-paid" style={{ marginTop: "8px" }}>
						<form action={settleBooking.bind(null, booking.id, "cash")}>
							<button type="submit" className="admin-btn admin-btn--small">
								Settle {eur(owedCents)} · cash
							</button>
						</form>
						<form action={settleBooking.bind(null, booking.id, "card")}>
							<button type="submit" className="admin-btn admin-btn--small">
								Settle {eur(owedCents)} · card
							</button>
						</form>
					</div>
				)}

				{unassignedCharges.length > 0 && (
					<details className="admin-link-charge">
						<summary>
							Link a Stripe payment · {unassignedCharges.length} unassigned
						</summary>
						<p className="admin-card-hint">
							Card payments in Stripe not yet tied to any booking — usually an
							ad-hoc payment link. Link the one that belongs to{" "}
							{booking.name} and it counts as a card payment here.
						</p>
						<ul className="admin-charge-list">
							{unassignedCharges.map((c) => (
								<li key={c.key} className="admin-charge-row">
									<div className="admin-charge-main">
										<span className="admin-cell-strong">{eur(c.amountCents)}</span>
										<span className="admin-cell-muted">
											{c.name || c.email || "unknown"} ·{" "}
											{formatShortDate(
												new Date(c.created * 1000).toISOString().slice(0, 10),
											)}
										</span>
									</div>
									<form action={linkStripeCharge.bind(null, booking.id)}>
										<input type="hidden" name="chargeKey" value={c.key} />
										<input
											type="hidden"
											name="amountCents"
											value={c.amountCents}
										/>
										<button type="submit" className="admin-btn admin-btn--small">
											Link to this booking
										</button>
									</form>
								</li>
							))}
						</ul>
					</details>
				)}
			</article>

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

			{/* Destructive action lives at the very bottom, away from the
			    everyday buttons, so it can't be hit by accident. */}
			<div className="admin-danger-zone">
				<div>
					<h2 className="admin-danger-zone-title">Delete booking</h2>
					<p className="admin-danger-zone-note">
						Permanent. Removes the booking, its gear assignments and its
						payment record.
					</p>
				</div>
				<DeleteBookingButton bookingId={id} customerName={booking.name} />
			</div>
		</section>
	);
}

/**
 * Plain-text handover for whoever covers a delivery — the friend taking
 * over in August. Everything needed on the road: who, where (+ map),
 * when (per-person dates/times when they differ), which gear (incl. the
 * assigned board's real name), extras, and any notes.
 */
function buildHandover(b: Booking, fleet: FleetData | null): string {
	const ref = `SR-${String(b.id).padStart(5, "0")}`;
	const staggered = (b.people ?? []).some(
		(p) =>
			p.checkin &&
			p.checkout &&
			(p.checkin !== b.checkin || p.checkout !== b.checkout),
	);
	const L: string[] = [`${ref} · ${b.name}`];
	if (b.phone) L.push(`Phone: ${b.phone}`);
	L.push("");
	L.push(`Delivery: ${formatLongDate(b.checkin)}${b.deliveryTime ? ` at ${b.deliveryTime}` : ""}`);
	L.push(`Pickup: ${formatLongDate(b.checkout)}${b.pickupTime ? ` at ${b.pickupTime}` : ""}`);
	if (b.accommodation) L.push(`Where: ${b.accommodation}`);
	const map = mapsUrl(b.accommodation);
	if (map) L.push(`Map: ${map}`);
	L.push("");
	L.push("Gear:");
	(b.people ?? []).forEach((p, i) => {
		const who = p.name?.trim() || `Person ${i + 1}`;
		const bits = [packageShort(p.package)];
		if (p.board) bits.push(p.board);
		const asg = fleet?.assignments.find(
			(a) => a.bookingId === b.id && a.personIndex === i,
		);
		const boardName = asg
			? fleet?.fleet.find((f) => f.id === asg.boardId)?.name
			: null;
		if (boardName) bits.push(`(${boardName})`);
		if (p.wetsuitSize) bits.push(`wetsuit ${p.wetsuitSize}`);
		let line = `- ${who}: ${bits.filter(Boolean).join(" · ")}`;
		if (staggered && p.checkin && p.checkout) {
			line += `  [${formatLongDate(p.checkin)} → ${formatLongDate(p.checkout)}]`;
		}
		L.push(line);
	});
	const extras = (b.addons ?? []).map(
		(a) => `${a.quantity}× ${getAddonTariff(a.key)?.label ?? a.key}`,
	);
	if (extras.length) {
		L.push("");
		L.push(`Extras: ${extras.join(", ")}`);
	}
	if (b.message) {
		L.push("");
		L.push(`Customer note: ${b.message}`);
	}
	if (b.ownerNotes) {
		L.push("");
		L.push(`Notes: ${b.ownerNotes}`);
	}
	return L.join("\n");
}

function ordinalSuffix(n: number): string {
	const s = ["th", "st", "nd", "rd"];
	const v = n % 100;
	return s[(v - 20) % 10] ?? s[v] ?? s[0]!;
}
