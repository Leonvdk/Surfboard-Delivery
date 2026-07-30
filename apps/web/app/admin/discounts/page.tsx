import type Stripe from "stripe";
import { getStripe } from "../../lib/stripe";
import { DiscountForm } from "../_components/discount-form";
import { deactivateDiscount } from "../_discount-actions";
import { formatShortDate } from "../_lib/dates";

export const dynamic = "force-dynamic";

/** "20% off" / "€15 off" from the coupon. */
function discountLabel(coupon: Stripe.Coupon | null): string {
	if (!coupon) return "—";
	if (coupon.percent_off != null) return `${coupon.percent_off}% off`;
	if (coupon.amount_off != null) return `€${(coupon.amount_off / 100).toString()} off`;
	return "—";
}

/** Whole order, or the package name (parsed from the coupon name we set). */
function scopeLabel(coupon: Stripe.Coupon | null): string {
	if (!coupon) return "—";
	const restricted = (coupon.applies_to?.products?.length ?? 0) > 0;
	if (!restricted) return "Whole order";
	const fromName = coupon.name?.split("—")[1]?.trim();
	return fromName || "One package";
}

export default async function AdminDiscountsPage() {
	const stripe = getStripe();
	if (!stripe) {
		return (
			<section className="admin-empty">
				<h1>Stripe not configured</h1>
				<p>
					Set <code>STRIPE_SECRET_KEY</code> in Vercel (with Coupons / Promotion codes / Products
					write access) to manage discount codes.
				</p>
			</section>
		);
	}

	let codes: Stripe.PromotionCode[] = [];
	let fetchError: string | null = null;
	try {
		// Expand the coupon so we can read percent_off / amount_off / applies_to
		// (the 2026-06-24 API nests it under `promotion`).
		const res = await stripe.promotionCodes.list({
			limit: 100,
			expand: ["data.promotion.coupon"],
		});
		codes = res.data;
	} catch (err) {
		fetchError = err instanceof Error ? err.message : "Unknown Stripe error";
	}

	return (
		<section className="admin-list-page">
			<header className="admin-page-header">
				<h1>Discount codes</h1>
			</header>

			<article className="admin-card">
				<h2>New code</h2>
				<p className="admin-card-hint">
					Codes work on any booking payment link — the customer types them at Stripe checkout. Limit
					a code to one package, or leave it on the whole order; cap the number of uses, or leave it
					unlimited.
				</p>
				<DiscountForm />
			</article>

			<article className="admin-card">
				<h2>All codes</h2>
				{fetchError && (
					<p className="admin-card-hint admin-sync-status--warn">
						Couldn&apos;t load codes from Stripe: {fetchError}
					</p>
				)}
				{!fetchError && codes.length === 0 && (
					<p className="admin-empty-inline">No discount codes yet.</p>
				)}
				{codes.length > 0 && (
					<div className="admin-table-wrap">
						<table className="admin-table">
							<thead>
								<tr>
									<th>Code</th>
									<th>Discount</th>
									<th>Applies to</th>
									<th>Used</th>
									<th>Status</th>
									<th>Created</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{codes.map((p) => {
									// promotion.coupon is a Coupon object once expanded; guard
									// for the string-id / null cases.
									const raw = p.promotion.coupon;
									const coupon = typeof raw === "object" && raw !== null ? raw : null;
									const used = `${p.times_redeemed}${p.max_redemptions ? ` / ${p.max_redemptions}` : ""}`;
									return (
										<tr key={p.id}>
											<td>
												<span className="admin-cell-strong">{p.code}</span>
											</td>
											<td>{discountLabel(coupon)}</td>
											<td>{scopeLabel(coupon)}</td>
											<td>{used}</td>
											<td>
												<span
													className={`admin-status admin-status--${p.active ? "confirmed" : "cancelled"}`}
												>
													{p.active ? "Active" : "Inactive"}
												</span>
											</td>
											<td>
												{formatShortDate(new Date(p.created * 1000).toISOString().slice(0, 10))}
											</td>
											<td>
												{p.active ? (
													<form action={deactivateDiscount.bind(null, p.id)}>
														<button
															type="submit"
															className="admin-board-remove"
															aria-label={`Deactivate ${p.code}`}
														>
															deactivate
														</button>
													</form>
												) : (
													"—"
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</article>
		</section>
	);
}
