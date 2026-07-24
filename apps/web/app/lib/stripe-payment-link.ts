import { getStripe } from "./stripe";

/**
 * Payment links for admin-created bookings.
 *
 * Our pricing (daily prorated → weekly cap → 2-week cap → extended
 * per-day, per person and package tier) can't be expressed in Stripe's
 * catalog without a product per gear × duration combination. So Stripe is
 * deliberately NOT the pricing engine: pricing.ts computes the euro
 * amounts, Leon adjusts the final number if he wants, and this module
 * turns the result into a Payment Link with one-off inline prices —
 * `prices.create({ product_data })` needs no pre-created catalog entries.
 *
 * Payment Links (not Checkout Sessions) because their URLs are permanent;
 * a customer may pay days after receiving the confirmation email, and
 * Checkout Session URLs expire after 24h.
 *
 * Every failure path returns null instead of throwing — the caller falls
 * back to the "send without payment link" flow. Requires the restricted
 * key to have Products: Write and Payment Links: Write (the read-only
 * revenue key will fail → null → graceful fallback).
 */

export interface PaymentLinkLine {
	/** Shown on the Stripe checkout page, e.g. "Full Package · 8 days — Alice" */
	label: string;
	amountEuros: number;
}

export async function createBookingPaymentLink(args: {
	bookingId: number;
	requestRef: string;
	lines: PaymentLinkLine[];
	/** When Leon adjusted the total away from the computed sum, we charge
	 * his number: a single adjustment line makes up the difference. */
	finalTotalEuros: number;
}): Promise<string | null> {
	const stripe = getStripe();
	if (!stripe) return null;

	const validLines = args.lines.filter(
		(l) => Number.isFinite(l.amountEuros) && l.amountEuros > 0 && l.label.trim(),
	);
	if (!Number.isFinite(args.finalTotalEuros) || args.finalTotalEuros <= 0) {
		return null;
	}

	const computedSum = validLines.reduce((s, l) => s + l.amountEuros, 0);
	const adjustment = args.finalTotalEuros - computedSum;

	const chargeLines: PaymentLinkLine[] =
		validLines.length > 0
			? [...validLines]
			: [
					{
						label: `Surf gear rental — booking ${args.requestRef}`,
						amountEuros: args.finalTotalEuros,
					},
				];
	if (validLines.length > 0 && adjustment !== 0) {
		if (adjustment > 0) {
			chargeLines.push({ label: "Adjustment", amountEuros: adjustment });
		} else {
			chargeLines.push({ label: "Discount", amountEuros: adjustment });
		}
	}

	// Stripe line items can't be negative. If a discount would be needed,
	// charge the final total as one consolidated line instead.
	const finalLines = chargeLines.some((l) => l.amountEuros < 0)
		? [
				{
					label: `Surf gear rental — booking ${args.requestRef}`,
					amountEuros: args.finalTotalEuros,
				},
			]
		: chargeLines;

	try {
		const priceIds: string[] = [];
		for (const line of finalLines) {
			const price = await stripe.prices.create({
				currency: "eur",
				unit_amount: Math.round(line.amountEuros * 100),
				product_data: {
					name: `${line.label} · ${args.requestRef}`,
				},
			});
			priceIds.push(price.id);
		}

		const link = await stripe.paymentLinks.create({
			line_items: priceIds.map((price) => ({ price, quantity: 1 })),
			metadata: {
				bookingId: String(args.bookingId),
				requestRef: args.requestRef,
				source: "admin-created-booking",
			},
			// After payment Stripe shows its default confirmation; the charge
			// lands in the existing revenue dashboard via charges.list.
		});

		return link.url;
	} catch (err) {
		// Most likely: key lacks write permissions (restricted read-only
		// revenue key) or network trouble. Caller falls back to no-link flow.
		console.error("Stripe payment link creation failed:", err);
		return null;
	}
}
