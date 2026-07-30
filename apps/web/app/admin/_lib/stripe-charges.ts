import { getStripe } from "../../lib/stripe";

/**
 * A succeeded Stripe charge that our system has NOT tied to a booking — the
 * classic case being an ad-hoc payment link created before bookingId metadata
 * was wired in. Surfaced on the booking page so Leon can attach it by hand.
 */
export interface UnassignedCharge {
	/** The key we store in bookingPayments.stripeChargeId — the payment intent
	 * when present (matching the webhook), else the charge id. */
	key: string;
	amountCents: number;
	name: string | null;
	email: string | null;
	/** Unix seconds. */
	created: number;
}

/**
 * Recent succeeded, non-refunded charges whose key isn't already in
 * `assignedKeys`. Bounded in both time and count so a booking page load can't
 * fan out into thousands of Stripe rows. Returns [] (never throws) when Stripe
 * is unconfigured or the call fails — reconciliation is a nicety, not a
 * blocker.
 */
export async function listUnassignedCharges(
	assignedKeys: Set<string>,
	sinceDays = 180,
	max = 25,
): Promise<UnassignedCharge[]> {
	const stripe = getStripe();
	if (!stripe) return [];
	const out: UnassignedCharge[] = [];
	try {
		const since = Math.floor(Date.now() / 1000) - sinceDays * 86_400;
		for await (const c of stripe.charges.list({
			limit: 100,
			created: { gte: since },
		})) {
			if (c.status !== "succeeded" || c.refunded) continue;
			const pi = typeof c.payment_intent === "string" ? c.payment_intent : null;
			const key = pi ?? c.id;
			// Assigned if either the intent or the charge id is already recorded.
			if (assignedKeys.has(key) || assignedKeys.has(c.id)) continue;
			out.push({
				key,
				amountCents: c.amount,
				name: c.billing_details?.name ?? null,
				email: c.billing_details?.email ?? c.receipt_email ?? null,
				created: c.created,
			});
			if (out.length >= max) break;
		}
	} catch {
		return out;
	}
	return out;
}
