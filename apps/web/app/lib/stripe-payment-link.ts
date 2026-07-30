import type { PackageTier } from "./pricing";
import { getPackageProductId } from "./stripe-packages";
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
	/** When set, the line's price is attached to the stable package product,
	 * so a package-restricted discount code can apply to it. Add-on and
	 * adjustment lines leave this unset and use a one-off product. */
	packageTier?: PackageTier;
}

export interface PaymentLinkResult {
	url: string | null;
	/** Stripe's id for the link — stored so a price change can deactivate
	 * the stale link (the id isn't derivable from the buy.stripe.com URL). */
	id?: string | null;
	/** Why there's no url — surfaced in the admin review-send dialog so
	 * permission/key problems are diagnosable without digging in logs. */
	error?: string;
}

/**
 * Deactivate a payment link so a stale amount can't be paid after the
 * price changed. Best-effort: a failure here shouldn't block the new
 * link from being created and sent.
 */
export async function deactivatePaymentLink(linkId: string): Promise<void> {
	const stripe = getStripe();
	if (!stripe) return;
	try {
		await stripe.paymentLinks.update(linkId, { active: false });
	} catch (err) {
		console.error("Stripe payment link deactivate failed:", err);
	}
}

export async function createBookingPaymentLink(args: {
	bookingId: number;
	requestRef: string;
	lines: PaymentLinkLine[];
	/** When Leon adjusted the total away from the computed sum, we charge
	 * his number: a single adjustment line makes up the difference. */
	finalTotalEuros: number;
}): Promise<PaymentLinkResult> {
	const stripe = getStripe();
	if (!stripe) {
		return { url: null, error: "STRIPE_SECRET_KEY is not set in Vercel." };
	}

	const validLines = args.lines.filter(
		(l) => Number.isFinite(l.amountEuros) && l.amountEuros > 0 && l.label.trim(),
	);
	if (!Number.isFinite(args.finalTotalEuros) || args.finalTotalEuros <= 0) {
		return { url: null, error: "Final total must be a positive amount." };
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

	// Track which call fails so a permission error names the scope to fix:
	// prices.create needs Products: Write, paymentLinks.create needs
	// Payment Links: Write — a restricted key must have BOTH.
	let stage: "creating prices (needs Products: Write)" | "creating the payment link (needs Payment Links: Write)" =
		"creating prices (needs Products: Write)";
	try {
		const priceIds: string[] = [];
		for (const line of finalLines) {
			// Package lines attach to the stable package product so a
			// package-restricted discount code can target them; everything
			// else (add-ons, adjustments) uses a one-off product carrying the
			// descriptive label. A package product lookup that fails falls back
			// to the label — the link still works, just without the discount
			// hook for that line.
			const productId = line.packageTier
				? await getPackageProductId(line.packageTier)
				: null;
			const price = await stripe.prices.create({
				currency: "eur",
				unit_amount: Math.round(line.amountEuros * 100),
				...(productId
					? { product: productId }
					: {
							product_data: {
								// Customer-facing line on the checkout page — keep it about
								// the gear. The booking ref rides in the payment link's
								// metadata, which is what the webhook reconciles against.
								name: line.label,
							},
						}),
			});
			priceIds.push(price.id);
		}

		stage = "creating the payment link (needs Payment Links: Write)";
		const link = await stripe.paymentLinks.create({
			line_items: priceIds.map((price) => ({ price, quantity: 1 })),
			// Let customers enter a discount code at checkout. Stripe validates
			// it against the promotion codes created on the Discounts page.
			allow_promotion_codes: true,
			metadata: {
				bookingId: String(args.bookingId),
				requestRef: args.requestRef,
				source: "admin-created-booking",
			},
			// After payment Stripe shows its default confirmation; the charge
			// lands in the existing revenue dashboard via charges.list.
		});

		return { url: link.url, id: link.id };
	} catch (err) {
		console.error("Stripe payment link creation failed:", err);
		const message = err instanceof Error ? err.message : String(err);
		return { url: null, error: `Stripe failed while ${stage}: ${message}` };
	}
}
