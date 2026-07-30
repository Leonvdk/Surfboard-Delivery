import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getDb, schema } from "../../../lib/db/client";
import { recomputeBookingPaid } from "../../../lib/payments";
import { getStripe } from "../../../lib/stripe";

/**
 * Stripe webhook — makes the admin platform hear payments landing.
 *
 * Setup (one-time, in the Stripe dashboard):
 *   Developers → Webhooks → Add endpoint
 *   URL:    https://surfrental-aljezur.com/api/stripe/webhook
 *   Events: checkout.session.completed
 *   Then put the endpoint's signing secret in Vercel as
 *   STRIPE_WEBHOOK_SECRET (Production).
 *
 * Payment Links produce a Checkout Session on payment; our links carry
 * bookingId in metadata (copied onto the session — with a fallback that
 * retrieves the payment link when it isn't). On completion we stamp
 * paidAt + the amount on the booking, bust the admin cache, and push a
 * notification to Leon's PWA.
 */

export async function POST(request: Request) {
	const stripe = getStripe();
	const secret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!stripe || !secret) {
		console.error("Stripe webhook hit but STRIPE_WEBHOOK_SECRET/key missing");
		return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
	}

	const signature = request.headers.get("stripe-signature");
	if (!signature) {
		return NextResponse.json({ error: "Missing signature" }, { status: 400 });
	}

	// Signature verification needs the exact raw body bytes.
	const rawBody = await request.text();
	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(rawBody, signature, secret);
	} catch (err) {
		console.error("Stripe webhook signature verification failed:", err);
		return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
	}

	// Subscribed events: completed, async_payment_succeeded,
	// async_payment_failed, expired.
	// - completed with payment_status "paid" → cards/wallets, settle now.
	// - completed with "unpaid" → an async method (Multibanco/SEPA — common
	//   for Portuguese customers) started; funds arrive later via
	//   async_payment_succeeded, so just acknowledge.
	// - async_payment_succeeded → the delayed funds landed; treat as paid.
	// - async_payment_failed → the customer thinks they paid but the debit
	//   bounced; push a warning so Leon follows up.
	// - expired → routine (payment links mint a session per visit); ignore.
	const isPaidEvent =
		(event.type === "checkout.session.completed" &&
			(event.data.object as Stripe.Checkout.Session).payment_status ===
				"paid") ||
		event.type === "checkout.session.async_payment_succeeded";
	const isFailedEvent = event.type === "checkout.session.async_payment_failed";

	if (!isPaidEvent && !isFailedEvent) {
		return NextResponse.json({ received: true });
	}

	const session = event.data.object as Stripe.Checkout.Session;

	// Find the booking: session metadata first, payment-link metadata as
	// fallback (Stripe copies link metadata onto sessions, but don't bet on it).
	let bookingIdRaw = session.metadata?.bookingId;
	if (!bookingIdRaw && session.payment_link) {
		try {
			const link = await stripe.paymentLinks.retrieve(
				typeof session.payment_link === "string"
					? session.payment_link
					: session.payment_link.id,
			);
			bookingIdRaw = link.metadata?.bookingId;
		} catch (err) {
			console.error("Payment link retrieve failed:", err);
		}
	}
	const bookingId = bookingIdRaw ? Number.parseInt(bookingIdRaw, 10) : Number.NaN;
	if (!Number.isFinite(bookingId)) {
		// A payment we can't attribute — acknowledge (don't make Stripe
		// retry forever) but log loudly for manual reconciliation.
		console.error(
			`Stripe payment without bookingId metadata: session ${session.id}, €${(session.amount_total ?? 0) / 100}`,
		);
		return NextResponse.json({ received: true });
	}

	const db = getDb();
	if (!db) {
		// No DB — return 500 so Stripe retries once infra is back.
		return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
	}

	const [booking] = await db
		.select()
		.from(schema.bookings)
		.where(eq(schema.bookings.id, bookingId))
		.limit(1);
	if (!booking) {
		console.error(`Stripe payment for unknown booking #${bookingId}`);
		return NextResponse.json({ received: true });
	}

	if (isFailedEvent) {
		// No DB change — the booking simply isn't paid. Warn Leon: the
		// customer likely believes they paid (Multibanco/SEPA bounce).
		try {
			const { sendPushToAll } = await import("../../../lib/push");
			await sendPushToAll({
				title: "Payment failed",
				body: `${booking.name} · SR-${String(bookingId).padStart(5, "0")} — delayed payment bounced, follow up`,
				url: `/admin/bookings/${bookingId}`,
				tag: `payment-failed-${bookingId}`,
			});
		} catch (pushErr) {
			console.error("Payment-failed push error:", pushErr);
		}
		return NextResponse.json({ received: true });
	}

	// Record the payment in the ledger. Idempotent on the charge key, so a
	// re-delivered webhook can't add the same payment twice — this replaces
	// the old "first write wins on booking.paidAt" guard and coexists with
	// any manual cash payment on the same booking.
	const chargeKey =
		(typeof session.payment_intent === "string" ? session.payment_intent : null) ??
		session.id;
	const already = await db
		.select({ id: schema.bookingPayments.id })
		.from(schema.bookingPayments)
		.where(
			and(
				eq(schema.bookingPayments.bookingId, bookingId),
				eq(schema.bookingPayments.stripeChargeId, chargeKey),
			),
		)
		.limit(1);

	if (already.length === 0) {
		await db.insert(schema.bookingPayments).values({
			bookingId,
			amountCents: session.amount_total ?? 0,
			method: "card",
			stripeChargeId: chargeKey,
			note: "Stripe checkout",
		});
		await recomputeBookingPaid(bookingId);
		revalidateTag("bookings", "max");

		try {
			const { sendPushToAll } = await import("../../../lib/push");
			const euros = ((session.amount_total ?? 0) / 100).toFixed(2).replace(/\.00$/, "");
			await sendPushToAll({
				title: "Payment received",
				body: `€${euros} from ${booking.name} · SR-${String(bookingId).padStart(5, "0")}`,
				url: `/admin/bookings/${bookingId}`,
				tag: `payment-${bookingId}`,
			});
		} catch (pushErr) {
			console.error("Payment push error:", pushErr);
		}
	}

	// Make sure the payer lands in the Stripe customer base with a name.
	// New links set customer_creation:"always", so Stripe already made a
	// customer (email captured, name usually blank) — fill the name from the
	// booking. Older links made no customer, so create/find one by email.
	// Best-effort: never block the webhook ack.
	try {
		const customerId =
			typeof session.customer === "string" ? session.customer : null;
		if (customerId) {
			await stripe.customers.update(customerId, { name: booking.name });
		} else {
			const email = session.customer_details?.email ?? booking.email;
			if (email) {
				const existing = await stripe.customers.list({ email, limit: 1 });
				if (existing.data[0]) {
					await stripe.customers.update(existing.data[0].id, {
						name: booking.name,
					});
				} else {
					await stripe.customers.create({ name: booking.name, email });
				}
			}
		}
	} catch (custErr) {
		console.error("Stripe customer upsert failed:", custErr);
	}

	return NextResponse.json({ received: true });
}
