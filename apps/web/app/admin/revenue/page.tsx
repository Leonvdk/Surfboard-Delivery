import type Stripe from "stripe";
import { getStripe } from "../../lib/stripe";
import { RevenueLineChart } from "../_components/revenue-line-chart";

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

	const totalCents = charges.reduce((sum, c) => sum + c.amount, 0);
	const refundedCents = charges.reduce((sum, c) => sum + c.amount_refunded, 0);
	const netCents = totalCents - refundedCents;

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
				<RevenueLineChart trend={trendDays} />
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
