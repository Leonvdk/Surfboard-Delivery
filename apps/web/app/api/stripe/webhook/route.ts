import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getDb, schema } from "../../../lib/db/client";
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

	if (event.type !== "checkout.session.completed") {
		// Only checkout.session.completed is subscribed; tolerate others.
		return NextResponse.json({ received: true });
	}

	const session = event.data.object as Stripe.Checkout.Session;
	if (session.payment_status !== "paid") {
		// Async payment methods complete later via checkout.session
		// .async_payment_succeeded — not enabled on our links (cards/wallets
		// settle immediately), so just acknowledge.
		return NextResponse.json({ received: true });
	}

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

	// Idempotent: Stripe retries deliveries, and a second event must not
	// re-push. First write wins.
	if (booking.paidAt == null) {
		await db
			.update(schema.bookings)
			.set({
				paidAt: new Date(),
				paidAmountCents: session.amount_total ?? null,
				updatedAt: new Date(),
			})
			.where(eq(schema.bookings.id, bookingId));

		revalidateTag("bookings", "max");

		try {
			const { sendPushToAll } = await import("../../../lib/push");
			const euros = ((session.amount_total ?? 0) / 100).toFixed(2).replace(/\.00$/, "");
			await sendPushToAll({
				title: "💶 Payment received",
				body: `€${euros} from ${booking.name} · SR-${String(bookingId).padStart(5, "0")}`,
				url: `/admin/bookings/${bookingId}`,
				tag: `payment-${bookingId}`,
			});
		} catch (pushErr) {
			console.error("Payment push error:", pushErr);
		}
	}

	return NextResponse.json({ received: true });
}
