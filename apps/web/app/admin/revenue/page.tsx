import { desc } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import type Stripe from "stripe";
import type { Booking } from "../../lib/db/schema";
import { getDb, schema } from "../../lib/db/client";
import { getStripe } from "../../lib/stripe";
import { RevenueBarChart } from "../_components/revenue-bar-chart";
import { RevenueWindowSelect } from "../_components/revenue-window-select";
import {
	type BreakdownRow,
	StatBreakdown,
} from "../_components/stat-breakdown";
import { addExpense, deleteExpense } from "../_expense-actions";
import { getCachedBookings } from "../_lib/bookings-cache";
import { getCachedFleet } from "../_lib/boards-cache";
import { formatShortDate, todayIso } from "../_lib/dates";
import {
	bookingFunnelForRecentMonths,
	monthlyRollup,
	packageMix,
} from "../_lib/insights";
import {
	computeRevenue,
	eur,
	expenseBreakdown,
	onTheBooksCents,
	upcomingByWeek,
} from "../_lib/revenue-metrics";
import {
	REVENUE_WINDOW_COOKIE,
	resolveWindow,
} from "../_lib/revenue-window";

export const dynamic = "force-dynamic";

interface Props {
	searchParams: Promise<{ window?: string }>;
}

function formatDate(unix: number): string {
	return new Date(unix * 1000).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function iso(d: Date): string {
	return d.toISOString().slice(0, 10);
}
function isoDaysAgo(n: number): string {
	return iso(new Date(Date.now() - n * 86_400_000));
}
/** Monday (ISO week start) of the week containing `dateIso`. */
function weekStart(dateIso: string): string {
	const d = new Date(`${dateIso}T00:00:00Z`);
	const dow = (d.getUTCDay() + 6) % 7; // Mon=0
	d.setUTCDate(d.getUTCDate() - dow);
	return iso(d);
}
function monthKey(dateIso: string): string {
	return `${dateIso.slice(0, 7)}-01`;
}
function labelMonth(key: string): string {
	const parts = key.split("-");
	const y = Number(parts[0]);
	const mo = Number(parts[1]);
	return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString("en-GB", {
		month: "short",
		year: "2-digit",
		timeZone: "UTC",
	});
}
function labelWeek(key: string): string {
	const d = new Date(`${key}T00:00:00Z`);
	return `wk ${d.getUTCDate()} ${d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}`;
}

const PRODUCING = new Set(["confirmed", "in_progress", "completed"]);
function billed(b: Booking): number {
	return Math.round((b.finalTotal ?? b.estimatedTotal ?? 0) * 100);
}

/**
 * Revenue trend: billed € (recognised on checkout) per bucket, sized so the
 * bar count stays readable — daily for short windows, weekly for mid, monthly
 * for long / all-time.
 */
function buildTrend(
	bookings: Booking[],
	startIso: string | null,
	endIso: string,
	granularity: "day" | "week" | "month",
): Array<{ day: string; cents: number; label?: string }> {
	// Sum billed into buckets keyed by the granularity.
	const byBucket = new Map<string, number>();
	let earliest: string | null = null;
	for (const b of bookings) {
		if (b.deletedAt || !PRODUCING.has(b.status)) continue;
		if (b.checkout > endIso) continue;
		if (startIso && b.checkout < startIso) continue;
		const key =
			granularity === "day"
				? b.checkout
				: granularity === "week"
					? weekStart(b.checkout)
					: monthKey(b.checkout);
		byBucket.set(key, (byBucket.get(key) ?? 0) + billed(b));
		if (!earliest || b.checkout < earliest) earliest = b.checkout;
	}

	// Build a continuous axis start → end so gaps show as empty bars.
	const start = startIso ?? earliest ?? endIso;
	const out: Array<{ day: string; cents: number; label?: string }> = [];
	if (granularity === "day") {
		const endMs = new Date(`${endIso}T00:00:00Z`).getTime();
		const startMs = new Date(`${start}T00:00:00Z`).getTime();
		const days = Math.min(
			62,
			Math.max(1, Math.round((endMs - startMs) / 86_400_000) + 1),
		);
		for (let i = 0; i < days; i++) {
			const d = iso(new Date(endMs - (days - 1 - i) * 86_400_000));
			out.push({ day: d, cents: byBucket.get(d) ?? 0 });
		}
	} else if (granularity === "week") {
		let cur = weekStart(start);
		const last = weekStart(endIso);
		let guard = 0;
		while (cur <= last && guard++ < 60) {
			out.push({ day: cur, cents: byBucket.get(cur) ?? 0, label: labelWeek(cur) });
			const d = new Date(`${cur}T00:00:00Z`);
			d.setUTCDate(d.getUTCDate() + 7);
			cur = iso(d);
		}
	} else {
		let cur = monthKey(start);
		const last = monthKey(endIso);
		let guard = 0;
		while (cur <= last && guard++ < 120) {
			out.push({ day: cur, cents: byBucket.get(cur) ?? 0, label: labelMonth(cur) });
			const parts = cur.split("-");
			const y = Number(parts[0]);
			const mo = Number(parts[1]);
			cur = mo === 12 ? `${y + 1}-01-01` : `${y}-${String(mo + 1).padStart(2, "0")}-01`;
		}
	}
	return out;
}

function pctLabel(part: number, whole: number): string {
	if (whole <= 0) return "—";
	return `${Math.round((part / whole) * 100)}%`;
}

export default async function AdminRevenuePage({ searchParams }: Props) {
	const params = await searchParams;
	const cookieStore = await cookies();
	const win = resolveWindow(
		params.window ?? cookieStore.get(REVENUE_WINDOW_COOKIE)?.value,
	);
	const today = todayIso();
	const startIso = win.days ? isoDaysAgo(win.days - 1) : null;
	const startUnix = win.days ? Math.floor(Date.now() / 1000) - win.days * 86400 : 0;

	const stripe = getStripe();
	if (!stripe) {
		return (
			<section className="admin-empty">
				<h1>Stripe not configured</h1>
				<p>
					Set <code>STRIPE_SECRET_KEY</code> in Vercel (Restricted key with{" "}
					<code>charges:read</code>) to see card revenue. Booking-based revenue
					still works without it.
				</p>
			</section>
		);
	}

	// Stripe is now only needed for refunds + the recent-charges list;
	// "collected online" comes from the booking's webhook-set paidAt, which
	// is more reliable than scanning charges. Paginate so long/all-time
	// windows aren't capped at 100.
	let charges: Stripe.Charge[] = [];
	let fetchError: string | null = null;
	try {
		const listParams: Stripe.ChargeListParams = { limit: 100 };
		if (win.days) listParams.created = { gte: startUnix };
		for await (const c of stripe.charges.list(listParams)) {
			if (c.status === "succeeded") charges.push(c);
			if (charges.length >= 2000) break; // safety bound
		}
	} catch (err) {
		fetchError = err instanceof Error ? err.message : "Unknown Stripe error";
	}

	const allBookings = (await getCachedBookings()) ?? [];
	const db = getDb();
	const allExpenses = db
		? await db
				.select()
				.from(schema.expenses)
				.orderBy(desc(schema.expenses.date), desc(schema.expenses.id))
		: [];
	const fleetData = await getCachedFleet();
	const payments = db
		? await db
				.select({
					bookingId: schema.bookingPayments.bookingId,
					amountCents: schema.bookingPayments.amountCents,
					method: schema.bookingPayments.method,
					createdAt: schema.bookingPayments.createdAt,
				})
				.from(schema.bookingPayments)
		: [];

	// ── Money, all booking-based and window-scoped ──────────────────────
	const m = computeRevenue(allBookings, payments, startIso, today);
	const onBooks = onTheBooksCents(allBookings, today);

	// Stripe's raw refunded total — informational, shown only in the charges
	// table. It includes self-test refunds, so it does NOT drive the P&L;
	// the P&L uses real refunds Leon logs as negative ledger payments
	// (m.refundedCents), which is 0 until he logs one.
	const stripeRefundedCents = charges.reduce((s, c) => s + c.amount_refunded, 0);

	// Expenses: manual (in window) + gear purchased in window; all-time
	// includes undated gear so nothing is lost.
	const gearInvested = (fleetData?.fleet ?? []).reduce(
		(s, b) => s + (b.purchaseCost ?? 0),
		0,
	);
	const gearPurchasedInPeriod = win.days
		? (fleetData?.fleet ?? [])
				.filter((b) => b.purchaseDate && startIso && b.purchaseDate >= startIso)
				.reduce((s, b) => s + (b.purchaseCost ?? 0), 0)
		: gearInvested;
	const expenses = expenseBreakdown(
		allExpenses,
		gearPurchasedInPeriod,
		startIso,
		today,
	);
	const resultCents = m.billedCents - m.refundedCents - expenses.totalCents;
	const marginPct =
		m.billedCents > 0 ? Math.round((resultCents / m.billedCents) * 100) : null;

	// ── Breakdown rows behind the clickable tiles ───────────────────────
	// Turn each headline number into a tap-to-see itemised list, so "why is
	// billed €320?" is answered in one tap (and a missing booking is obvious).
	const inWin = (d: string) => (!startIso || d >= startIso) && d <= today;
	const ref = (bid: number) => `SR-${String(bid).padStart(5, "0")}`;
	const nameById = new Map(allBookings.map((b) => [b.id, b.name] as const));
	const paidByBooking = new Map<number, number>();
	for (const p of payments) {
		paidByBooking.set(
			p.bookingId,
			(paidByBooking.get(p.bookingId) ?? 0) + p.amountCents,
		);
	}
	const producingInWindow = allBookings.filter(
		(b) => !b.deletedAt && PRODUCING.has(b.status) && inWin(b.checkout),
	);

	const billedRows: BreakdownRow[] = [...producingInWindow]
		.sort((a, b) => billed(b) - billed(a))
		.map((b) => ({
			label: b.name,
			sub: `${ref(b.id)} · out ${formatShortDate(b.checkout)} · ${b.peopleCount}p`,
			amount: eur(billed(b)),
			href: `/admin/bookings/${b.id}`,
		}));

	const outstandingRows: BreakdownRow[] = producingInWindow
		.map((b) => {
			const paid = paidByBooking.get(b.id) ?? 0;
			return { b, owed: Math.max(0, billed(b) - paid), paid };
		})
		.filter((x) => x.owed > 0)
		.sort((a, b) => b.owed - a.owed)
		.map(({ b, owed, paid }) => ({
			label: b.name,
			sub: `${eur(paid)} of ${eur(billed(b))} paid`,
			amount: eur(owed),
			href: `/admin/bookings/${b.id}`,
		}));

	const refundRows: BreakdownRow[] = payments
		.filter(
			(p) => p.amountCents < 0 && inWin(p.createdAt.toISOString().slice(0, 10)),
		)
		.sort((a, b) => a.amountCents - b.amountCents)
		.map((p) => ({
			label: nameById.get(p.bookingId) ?? `Booking #${p.bookingId}`,
			sub: `${p.method} · ${formatShortDate(p.createdAt.toISOString().slice(0, 10))}`,
			amount: eur(-p.amountCents),
			href: `/admin/bookings/${p.bookingId}`,
		}));

	const expenseItems: Array<{ row: BreakdownRow; cents: number }> = [
		...allExpenses
			.filter((e) => inWin(e.date))
			.map((e) => {
				const cents = Math.round(e.amount * 100);
				return {
					cents,
					row: {
						label: e.label,
						sub: `${e.category?.trim() || "Uncategorised"} · ${formatShortDate(e.date)}`,
						amount: eur(cents),
					},
				};
			}),
		...(fleetData?.fleet ?? [])
			.filter(
				(b) =>
					(b.purchaseCost ?? 0) > 0 &&
					(!win.days ||
						(b.purchaseDate != null &&
							startIso != null &&
							b.purchaseDate >= startIso)),
			)
			.map((b) => {
				const cents = Math.round((b.purchaseCost ?? 0) * 100);
				return {
					cents,
					row: {
						label: `${b.name} (gear)`,
						sub: `gear purchase${b.purchaseDate ? ` · ${formatShortDate(b.purchaseDate)}` : " · undated"}`,
						amount: eur(cents),
					},
				};
			}),
	];
	const expenseRows: BreakdownRow[] = expenseItems
		.sort((a, b) => b.cents - a.cents)
		.map((x) => x.row);

	// Profit is a calculation, not a list: show the waterfall that produces
	// the Result — billed, minus refunds, minus expenses.
	const profitRows: BreakdownRow[] = [
		{
			label: "Revenue billed",
			sub: `${m.bookingCount} booking${m.bookingCount === 1 ? "" : "s"}`,
			amount: eur(m.billedCents),
		},
		{
			label: "Refunds",
			sub: "logged refunds",
			amount: `−${eur(m.refundedCents)}`,
		},
		{
			label: "Expenses",
			sub: "costs + gear bought in window",
			amount: `−${eur(expenses.totalCents)}`,
		},
	];

	const trend = buildTrend(
		allBookings,
		startIso,
		today,
		!win.days || win.days > 180 ? "month" : win.days <= 31 ? "day" : "week",
	);

	const upcoming = upcomingByWeek(allBookings, today, 8);
	const upcomingTotal = upcoming.reduce((s, w) => s + w.cents, 0);
	const funnel = bookingFunnelForRecentMonths(allBookings);
	const mix = packageMix(allBookings, win.days ?? 3650);
	const rollup = monthlyRollup(allBookings, 12);

	return (
		<section className="admin-revenue-page">
			<header className="admin-page-header">
				<h1>Revenue</h1>
				<div className="admin-page-header-actions">
					<Link href="/admin/discounts" className="admin-row-link">
						Discount codes →
					</Link>
					<RevenueWindowSelect value={win.key} />
				</div>
			</header>

			{fetchError && (
				<p className="admin-card-hint admin-sync-status--warn">
					Stripe fetch failed ({fetchError}) — card refunds may be missing;
					booking figures below are unaffected.
				</p>
			)}

			{/* Headline money tiles — the "how's the business" glance. */}
			<article className="admin-card">
				<div className="admin-kpi-grid">
					<StatBreakdown
						triggerClassName="admin-kpi"
						title="Revenue billed"
						rows={billedRows}
						total={eur(m.billedCents)}
						empty="No confirmed / in-progress / completed bookings in this window."
						footnote="Counts bookings by pickup date, once confirmed. A booking still in ‘requested’ — or with no final price — won’t appear until you confirm it and set its price."
					>
						<span className="admin-kpi-label">Revenue billed</span>
						<strong>{eur(m.billedCents)}</strong>
						<span className="admin-kpi-sub">{m.bookingCount} bookings</span>
					</StatBreakdown>
					<div className="admin-kpi">
						<span className="admin-kpi-label">Collected</span>
						<strong>{eur(m.collectedCents)}</strong>
						<span className="admin-kpi-sub">
							{eur(m.collectedCashCents)} cash · {eur(m.collectedOnlineCents)} card
						</span>
					</div>
					<StatBreakdown
						triggerClassName={`admin-kpi${m.outstandingCents > 0 ? " admin-kpi--warn" : ""}`}
						title="Outstanding — who still owes"
						rows={outstandingRows}
						total={eur(m.outstandingCents)}
						empty="Nothing outstanding — every producing booking in this window is fully paid."
						footnote="Billed minus what's been recorded as paid, per booking. Record a cash or card payment on the booking to clear it."
					>
						<span className="admin-kpi-label">Outstanding</span>
						<strong>{eur(m.outstandingCents)}</strong>
						<span className="admin-kpi-sub">billed, not marked paid</span>
					</StatBreakdown>
					<StatBreakdown
						triggerClassName={`admin-kpi admin-kpi--result${resultCents < 0 ? " admin-kpi--negative" : ""}`}
						title="Profit — how it's calculated"
						rows={profitRows}
						total={eur(resultCents)}
						totalLabel="Result"
						empty=""
						footnote={
							marginPct != null
								? `Margin ${marginPct}% of revenue billed. Revenue billed − refunds − expenses, for the ${win.label.toLowerCase()} window.`
								: `Revenue billed − refunds − expenses, for the ${win.label.toLowerCase()} window.`
						}
					>
						<span className="admin-kpi-label">Profit</span>
						<strong>{eur(resultCents)}</strong>
						<span className="admin-kpi-sub">
							{marginPct != null ? `${marginPct}% margin` : "—"}
						</span>
					</StatBreakdown>
					<div className="admin-kpi">
						<span className="admin-kpi-label">Avg booking</span>
						<strong>{eur(m.aovCents)}</strong>
						<span className="admin-kpi-sub">{eur(m.perGearNightCents)}/gear-night</span>
					</div>
					<div className="admin-kpi">
						<span className="admin-kpi-label">On the books</span>
						<strong>{eur(onBooks)}</strong>
						<span className="admin-kpi-sub">upcoming, not yet paid</span>
					</div>
				</div>
				<p className="admin-card-hint">
					Revenue recognised when gear goes back (checkout), for confirmed /
					in-progress / completed bookings in the {win.label.toLowerCase()}{" "}
					window. Cash is only counted once you tap <strong>Mark paid in
					cash</strong> on the booking. Card figures come from Stripe.
				</p>
			</article>

			<article className="admin-card admin-card--compact">
				<h2>
					Revenue billed ·{" "}
					{!win.days || win.days > 180
						? "by month"
						: win.days <= 31
							? "by day"
							: "by week"}
				</h2>
				<RevenueBarChart trend={trend} />
			</article>

			{upcoming.length > 0 && (
				<article className="admin-card">
					<h2>Upcoming income · by week</h2>
					<p className="admin-card-hint">
						{eur(upcomingTotal)} booked from today forward (confirmed /
						in-progress), by delivery week.
					</p>
					<ul className="mix-list">
						{upcoming.map((w) => (
							<li key={w.weekStart} className="mix-row">
								<div className="mix-row-heading">
									<span>
										{w.label}
										<span className="admin-cell-muted"> · {w.count} booking{w.count === 1 ? "" : "s"}</span>
									</span>
									<span className="mix-row-pct">{eur(w.cents)}</span>
								</div>
								<div className="mix-row-bar">
									<div
										className="mix-row-bar-fill mix-row-bar-fill--board"
										style={{ width: `${upcomingTotal > 0 ? (w.cents / Math.max(...upcoming.map((u) => u.cents))) * 100 : 0}%` }}
									/>
								</div>
							</li>
						))}
					</ul>
				</article>
			)}

			{/* P&L breakdown */}
			<article className="admin-card">
				<h2>Profit &amp; loss · {win.label.toLowerCase()}</h2>
				<div className="admin-pl-grid">
					<div className="admin-pl-tile">
						<span className="admin-pl-label">Revenue billed</span>
						<strong>{eur(m.billedCents)}</strong>
					</div>
					<StatBreakdown
						triggerClassName="admin-pl-tile"
						title="Refunds"
						rows={refundRows}
						total={eur(m.refundedCents)}
						empty="No refunds logged in this window. (Stripe self-test refunds are excluded by design.)"
						footnote="Real refunds you record on a booking as a negative payment. Stripe's own test refunds never enter this figure."
					>
						<span className="admin-pl-label">Refunds</span>
						<strong>−{eur(m.refundedCents)}</strong>
					</StatBreakdown>
					<StatBreakdown
						triggerClassName="admin-pl-tile"
						title="Expenses"
						rows={expenseRows}
						total={eur(expenses.totalCents)}
						empty="No expenses or gear purchases in this window."
						footnote="Logged expenses plus gear bought in this window. Undated gear only shows in the all-time view."
					>
						<span className="admin-pl-label">Expenses</span>
						<strong>−{eur(expenses.totalCents)}</strong>
					</StatBreakdown>
					<div
						className={`admin-pl-tile admin-pl-tile--result${resultCents < 0 ? " admin-pl-tile--negative" : ""}`}
					>
						<span className="admin-pl-label">Result</span>
						<strong>{eur(resultCents)}</strong>
					</div>
				</div>
				{expenses.groups.length > 0 && (
					<>
						<h4 className="admin-modal-section">Where it goes</h4>
						<ul className="mix-list">
							{expenses.groups.map((g) => (
								<li key={g.category} className="mix-row">
									<div className="mix-row-heading">
										<span>{g.category}</span>
										<span className="mix-row-pct">
											{eur(g.cents)} · {Math.round(g.pct)}%
										</span>
									</div>
									<div className="mix-row-bar">
										<div
											className="mix-row-bar-fill mix-row-bar-fill--board"
											style={{ width: `${g.pct}%` }}
										/>
									</div>
								</li>
							))}
						</ul>
					</>
				)}
				<p className="admin-card-hint">
					All-time: {eur(gearInvested * 100)} invested in gear ·{" "}
					{eur(allExpenses.reduce((s, e) => s + e.amount, 0) * 100)} logged
					expenses. Gear without a purchase date only counts in the all-time
					number — set purchase dates on the Fleet page to place them in time.
				</p>
			</article>

			<article className="admin-card">
				<h2>Expenses</h2>
				<form action={addExpense} className="admin-board-form admin-expense-form">
					<div className="admin-board-form-grid">
						<label>
							Date
							<input type="date" name="date" required defaultValue={today} className="admin-input" />
						</label>
						<label>
							What
							<input type="text" name="label" required placeholder="e.g. Paid João for deliveries" className="admin-input" />
						</label>
						<label>
							Amount (€)
							<input type="number" name="amount" required min="1" placeholder="e.g. 40" className="admin-input" />
						</label>
						<label>
							Category
							<input type="text" name="category" placeholder="delivery / fuel / repair…" className="admin-input" list="expense-categories" />
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
					<button type="submit" className="admin-btn">Add expense</button>
				</form>

				{allExpenses.length === 0 ? (
					<p className="admin-empty-inline">No expenses logged yet — add the first one above.</p>
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
												{e.notes && <div className="admin-cell-muted">{e.notes}</div>}
											</td>
											<td>{e.category ?? "—"}</td>
											<td>€{e.amount}</td>
											<td>
												<form action={deleteWithId}>
													<button type="submit" className="admin-board-remove" aria-label={`Delete expense: ${e.label}`}>
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
						{[funnel.current, funnel.previous].map((col, idx) => (
							<div
								key={col.label}
								className={`funnel-col${idx === 1 ? " funnel-col--dim" : ""}`}
							>
								<div className="funnel-col-label">{col.label}</div>
								<div className="funnel-metric"><span>Requested</span><strong>{col.requested}</strong></div>
								<div className="funnel-metric"><span>Confirmed</span><strong>{col.confirmed}</strong></div>
								<div className="funnel-metric"><span>In progress</span><strong>{col.inProgress}</strong></div>
								<div className="funnel-metric"><span>Completed</span><strong>{col.completed}</strong></div>
								<div className="funnel-metric"><span>Cancelled</span><strong>{col.cancelled}</strong></div>
								<div className="funnel-metric funnel-metric--rate">
									<span>Confirm rate</span>
									<strong>{col.confirmRate != null ? `${Math.round(col.confirmRate * 100)}%` : "—"}</strong>
								</div>
							</div>
						))}
					</div>
				</article>

				<article className="admin-card">
					<h2>Package mix</h2>
					<p className="admin-card-hint">{win.label} · across all guests.</p>
					{mix.length === 0 ? (
						<p className="admin-empty-inline">Not enough per-person data yet.</p>
					) : (
						<ul className="mix-list">
							{mix.map((mi) => (
								<li key={mi.key} className="mix-row">
									<div className="mix-row-heading">
										<span>{mi.label}</span>
										<span className="mix-row-pct">{mi.count} · {Math.round(mi.pct)}%</span>
									</div>
									<div className="mix-row-bar">
										<div className={`mix-row-bar-fill mix-row-bar-fill--${mi.key}`} style={{ width: `${mi.pct}%` }} />
									</div>
								</li>
							))}
						</ul>
					)}
				</article>
			</div>

			<article className="admin-card">
				<h2>Monthly rollup</h2>
				<p className="admin-card-hint">Confirmed and completed bookings by check-in month · last 12 months.</p>
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
								<tr><td colSpan={7} className="admin-empty-inline">No producing bookings yet.</td></tr>
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
				<h2>Recent card charges</h2>
				<p className="admin-card-hint">
					Online Stripe payments in the {win.label.toLowerCase()} window ·{" "}
					{pctLabel(stripeRefundedCents, charges.reduce((s, c) => s + c.amount, 0))} refunded (Stripe, incl. tests).
				</p>
				<div className="admin-table-wrap">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Date</th>
								<th>Customer</th>
								<th>Amount</th>
								<th>Refunded</th>
							</tr>
						</thead>
						<tbody>
							{charges.length === 0 && (
								<tr><td colSpan={4} className="admin-empty-inline">No card charges in this window.</td></tr>
							)}
							{charges.slice(0, 40).map((c) => (
								<tr key={c.id}>
									<td>{formatDate(c.created)}</td>
									<td>
										<div className="admin-cell-strong">{c.billing_details?.name || "—"}</div>
										<div className="admin-cell-muted">{c.billing_details?.email || c.receipt_email || ""}</div>
									</td>
									<td>{eur(c.amount)}</td>
									<td>{c.amount_refunded > 0 ? eur(c.amount_refunded) : "—"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</article>
		</section>
	);
}
