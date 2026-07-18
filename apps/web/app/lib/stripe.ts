import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
	if (_stripe) return _stripe;
	const key = process.env.STRIPE_SECRET_KEY;
	if (!key) return null;
	_stripe = new Stripe(key, {
		apiVersion: "2026-06-24.dahlia",
		typescript: true,
	});
	return _stripe;
}
