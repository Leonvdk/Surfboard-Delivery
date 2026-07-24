import { desc } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb, schema } from "../../lib/db/client";
import { getStripe } from "../../lib/stripe";
import { RevenueBarChart } from "../_components/revenue-bar-chart";
import { addExpense, deleteExpense } from "../_expense-actions";
import { getCachedBookings } from "../_lib/bookings-cache";
import { getCachedFleet } from "../_lib/boards-cache";
import { formatShortDate, todayIso } from "../_lib/dates";
import {
	bookingFunnelForRecentMonths,
	monthlyRollup,
	packageMix,
} from "../_lib/insights";

export const dynamic = "force-dynamic";

interface Props {
	searchParams: Promise<{ days?: string }>;
}

function formatEuros(amountCents: number): string {
	return `€${(amountCents / 100).toFixed(2)}`;
}

function formatDate(unix: number): string {
	return new Date(unix * 1000).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export default async function AdminRevenuePage({ searchParams }: Props) {
	const params = await searchParams;
	const daysRaw = params.days ?? "30";
	const days = Math.max(7, Math.min(180, Number.parseInt(daysRaw, 10) || 30));
	const startTime = Math.floor(Date.now() / 1000) - days * 86400;

	const stripe = getStripe();
	if (!stripe) {
		return (
			<section className="admin-empty">
				<h1>Stripe not configured</h1>
				<p>
					Set <code>STRIPE_SECRET_KEY</code> in Vercel (use a Restricted API Key
					with <code>charges:read</code> and <code>customers:read</code> only)
					to see revenue.
				</p>
			</section>
		);
	}

	let charges: Stripe.Charge[] = [];
	let fetchError: string | null = null;
	try {
		const list = await stripe.charges.list({
			created: { gte: startTime },
			limit: 100,
		});
		charges = list.data.filter((c) => c.status === "succeeded" && !c.refunded);
	} catch (err) {
		fetchError = err instanceof Error ? err.message : "Unknown Stripe error";
	}

	if (fetchError) {
		return (
			<section className="admin-empty">
				<h1>Stripe fetch error</h1>
				<pre style={{ whiteSpace: "pre-wrap" }}>{fetchError}</pre>
			</section>
		);
	}

	// Bookings-side insights (funnel, package mix, monthly rollup) — served
	// from the shared cached dataset, no extra DB roundtrip.
	const allBookings = (await getCachedBookings()) ?? [];

	// Expenses + gear investment → the "do we actually make money" view.
	// Caveat shown in the UI: Stripe only sees online payments, so cash /
	// pay-on-delivery revenue isn't part of the P&L number.
	const db = getDb();
	const allExpenses = db
		? await db
				.select()
				.from(schema.expenses)
				.orderBy(desc(schema.expenses.date), desc(schema.expenses.id))
		: [];
	const fleetData = await getCachedFleet();
	const gearInvested = (fleetData?.fleet ?? []).reduce(
		(s, b) => s + (b.purchaseCost ?? 0),
		0,
	);
	const periodStartIso = new Date(startTime * 1000).toISOString().slice(0, 10);
	const periodExpensesTotal = allExpenses
		.filter((e) => e.date >= periodStartIso)
		.reduce((s, e) => s + e.amount, 0);
	const allExpensesTotal = allExpenses.reduce((s, e) => s + e.amount, 0);
	const today = todayIso();
	const funnel = bookingFunnelForRecentMonths(allBookings);
	const mix = packageMix(allBookings, 90);
	const rollup = monthlyRollup(allBookings, 12);

	const totalCents = charges.reduce((sum, c) => sum + c.amount, 0);
	const refundedCents = charges.reduce((sum, c) => sum + c.amount_refunded, 0);
	const netCents = totalCents - refundedCents;
	// Operating result for the selected window: Stripe net − manual expenses.
	const resultCents = netCents - periodExpensesTotal * 100;

	// Group charges by day for the trend
	const byDay = new Map<string, number>();
	for (const c of charges) {
		const day = new Date(c.created * 1000).toISOString().slice(0, 10);
		byDay.set(day, (byDay.get(day) ?? 0) + c.amount - c.amount_refunded);
	}
	const trendDays: Array<{ day: string; cents: number }> = [];
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date(Date.now() - i * 86400 * 1000).toISOString().slice(0, 10);
		trendDays.push({ day: d, cents: byDay.get(d) ?? 0 });
	}
	return (
		<section className="admin-revenue-page">
			<header className="admin-page-header">
				<h1>Revenue</h1>
				<div className="admin-page-summary">
					<span>Window: last {days} days</span>
					<span>{charges.length} charges</span>
					<span>Gross {formatEuros(totalCents)}</span>
					<span>Refunded {formatEuros(refundedCents)}</span>
					<span>Net {formatEuros(netCents)}</span>
				</div>
			</header>

			<article className="admin-card">
				<h2>Daily net revenue</h2>
				<RevenueBarChart trend={trendDays} />
			</article>

			<article className="admin-card">
				<h2>Profit &amp; loss · last {days} days</h2>
				<div className="admin-pl-grid">
					<div className="admin-pl-tile">
						<span className="admin-pl-label">Revenue (Stripe net)</span>
						<strong>{formatEuros(netCents)}</strong>
					</div>
					<div className="admin-pl-tile">
						<span className="admin-pl-label">Expenses</span>
						<strong>−€{periodExpensesTotal}</strong>
					</div>
					<div
						className={`admin-pl-tile admin-pl-tile--result${resultCents < 0 ? " admin-pl-tile--negative" : ""}`}
					>
						<span className="admin-pl-label">Result</span>
						<strong>{formatEuros(resultCents)}</strong>
					</div>
				</div>
				<p className="admin-card-hint">
					All-time: €{gearInvested} invested in gear (from the Fleet page) ·
					€{allExpensesTotal} manual expenses logged. Stripe only sees online
					payments — cash / pay-on-delivery revenue isn&apos;t counted here.
				</p>
			</article>

			<article className="admin-card">
				<h2>Expenses</h2>
				<form action={addExpense} className="admin-board-form admin-expense-form">
					<div className="admin-board-form-grid">
						<label>
							Date
							<input
								type="date"
								name="date"
								required
								defaultValue={today}
								className="admin-input"
							/>
						</label>
						<label>
							What
							<input
								type="text"
								name="label"
								required
								placeholder="e.g. Paid João for deliveries"
								className="admin-input"
							/>
						</label>
						<label>
							Amount (€)
							<input
								type="number"
								name="amount"
								required
								min="1"
								placeholder="e.g. 40"
								className="admin-input"
							/>
						</label>
						<label>
							Category
							<input
								type="text"
								name="category"
								placeholder="delivery / fuel / repair…"
								className="admin-input"
								list="expense-categories"
							/>
							<datalist id="expense-categories">
								<option value="delivery" />
								<option value="fuel" />
								<option value="repair" />
								<option value="wax & leashes" />
								<option value="marketing" />
								<option value="other" />
							</datalist>
						</label>
					</div>
					<button type="submit" className="admin-btn">
						Add expense
					</button>
				</form>

				{allExpenses.length === 0 ? (
					<p className="admin-empty-inline">
						No expenses logged yet — add the first one above.
					</p>
				) : (
					<div className="admin-table-wrap">
						<table className="admin-table">
							<thead>
								<tr>
									<th>Date</th>
									<th>What</th>
									<th>Category</th>
									<th>Amount</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{allExpenses.map((e) => {
									const deleteWithId = deleteExpense.bind(null, e.id);
									return (
										<tr key={e.id}>
											<td>{formatShortDate(e.date)}</td>
											<td>
												<div className="admin-cell-strong">{e.label}</div>
												{e.notes && (
													<div className="admin-cell-muted">{e.notes}</div>
												)}
											</td>
											<td>{e.category ?? "—"}</td>
											<td>€{e.amount}</td>
											<td>
												<form action={deleteWithId}>
													<button
														type="submit"
														className="admin-board-remove"
														aria-label={`Delete expense: ${e.label}`}
													>
														delete
													</button>
												</form>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</article>

			<div className="admin-detail-grid">
				<article className="admin-card">
					<h2>Booking funnel</h2>
					<p className="admin-card-hint">This month vs last.</p>
					<div className="funnel-grid">
						<div className="funnel-col">
							<div className="funnel-col-label">{funnel.current.label}</div>
							<div className="funnel-metric">
								<span>Requested</span>
								<strong>{funnel.current.requested}</strong>
							</div>
							<div className="funnel-metric">
								<span>Confirmed</span>
								<strong>{funnel.current.confirmed}</strong>
							</div>
							<div className="funnel-metric">
								<span>In progress</span>
								<strong>{funnel.current.inProgress}</strong>
							</div>
							<div className="funnel-metric">
								<span>Completed</span>
								<strong>{funnel.current.completed}</strong>
							</div>
							<div className="funnel-metric">
								<span>Cancelled</span>
								<strong>{funnel.current.cancelled}</strong>
							</div>
							<div className="funnel-metric funnel-metric--rate">
								<span>Confirm rate</span>
								<strong>
									{funnel.current.confirmRate != null
										? `${Math.round(funnel.current.confirmRate * 100)}%`
										: "—"}
								</strong>
							</div>
						</div>
						<div className="funnel-col funnel-col--dim">
							<div className="funnel-col-label">{funnel.previous.label}</div>
							<div className="funnel-metric">
								<span>Requested</span>
								<strong>{funnel.previous.requested}</strong>
							</div>
							<div className="funnel-metric">
								<span>Confirmed</span>
								<strong>{funnel.previous.confirmed}</strong>
							</div>
							<div className="funnel-metric">
								<span>In progress</span>
								<strong>{funnel.previous.inProgress}</strong>
							</div>
							<div className="funnel-metric">
								<span>Completed</span>
								<strong>{funnel.previous.completed}</strong>
							</div>
							<div className="funnel-metric">
								<span>Cancelled</span>
								<strong>{funnel.previous.cancelled}</strong>
							</div>
							<div className="funnel-metric funnel-metric--rate">
								<span>Confirm rate</span>
								<strong>
									{funnel.previous.confirmRate != null
										? `${Math.round(funnel.previous.confirmRate * 100)}%`
										: "—"}
								</strong>
							</div>
						</div>
					</div>
				</article>

				<article className="admin-card">
					<h2>Package mix</h2>
					<p className="admin-card-hint">Last 90 days · across all guests.</p>
					{mix.length === 0 ? (
						<p className="admin-empty-inline">Not enough per-person data yet.</p>
					) : (
						<ul className="mix-list">
							{mix.map((m) => (
								<li key={m.key} className="mix-row">
									<div className="mix-row-heading">
										<span>{m.label}</span>
										<span className="mix-row-pct">
											{m.count} · {Math.round(m.pct)}%
										</span>
									</div>
									<div className="mix-row-bar">
										<div
											className={`mix-row-bar-fill mix-row-bar-fill--${m.key}`}
											style={{ width: `${m.pct}%` }}
										/>
									</div>
								</li>
							))}
						</ul>
					)}
				</article>
			</div>

			<article className="admin-card">
				<h2>Monthly rollup</h2>
				<p className="admin-card-hint">Confirmed and completed bookings by check-in month.</p>
				<div className="admin-table-wrap">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Month</th>
								<th>Bookings</th>
								<th>Gear-nights</th>
								<th>Avg party</th>
								<th>Avg nights</th>
								<th>Estimated</th>
								<th>Final</th>
							</tr>
						</thead>
						<tbody>
							{rollup.length === 0 && (
								<tr>
									<td colSpan={7} className="admin-empty-inline">
										No producing bookings yet.
									</td>
								</tr>
							)}
							{rollup.map((r) => (
								<tr key={r.month}>
									<td>{r.label}</td>
									<td>{r.bookings}</td>
									<td>{r.gearNights}</td>
									<td>{r.avgPartySize.toFixed(1)}</td>
									<td>{r.avgTripNights.toFixed(1)}</td>
									<td>{r.estimateTotal > 0 ? `€${r.estimateTotal}` : "—"}</td>
									<td>{r.finalTotal > 0 ? `€${r.finalTotal}` : "—"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</article>

			<article className="admin-card">
				<h2>Recent charges</h2>
				<div className="admin-table-wrap">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Date</th>
								<th>Customer</th>
								<th>Amount</th>
								<th>Refunded</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							{charges.length === 0 && (
								<tr>
									<td colSpan={5} className="admin-empty-inline">
										No successful charges in this window.
									</td>
								</tr>
							)}
							{charges.slice(0, 40).map((c) => (
								<tr key={c.id}>
									<td>{formatDate(c.created)}</td>
									<td>
										<div className="admin-cell-strong">{c.billing_details?.name || "—"}</div>
										<div className="admin-cell-muted">{c.billing_details?.email || c.receipt_email || ""}</div>
									</td>
									<td>{formatEuros(c.amount)}</td>
									<td>{c.amount_refunded > 0 ? formatEuros(c.amount_refunded) : "—"}</td>
									<td>{c.description || "—"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</article>
		</section>
	);
}
