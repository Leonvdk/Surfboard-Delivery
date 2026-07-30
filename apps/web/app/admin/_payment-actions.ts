"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { getDb, schema } from "../lib/db/client";
import { recomputeBookingPaid } from "../lib/payments";
import { BOOKINGS_TAG } from "./_lib/bookings-cache";

type Method = "cash" | "card" | "other";
const METHODS: Method[] = ["cash", "card", "other"];

function revalidateBooking(id: number) {
	updateTag(BOOKINGS_TAG);
	revalidatePath(`/admin/bookings/${id}`);
	revalidatePath("/admin/revenue");
	revalidatePath("/admin");
}

/**
 * Add one payment to a booking's ledger. Handles the split/partial case:
 * a Stripe card payment plus a cash upsell are two rows that sum to what
 * was collected. Amount is entered in whole euros.
 */
export async function addPayment(bookingId: number, formData: FormData) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	const euros = Number(formData.get("amount"));
	const method = String(formData.get("method")) as Method;
	const note = (formData.get("note") as string)?.trim() || null;
	if (!Number.isFinite(euros) || euros <= 0) {
		throw new Error("Enter a positive amount.");
	}
	if (!METHODS.includes(method)) throw new Error("Pick a payment method.");
	await db.insert(schema.bookingPayments).values({
		bookingId,
		amountCents: Math.round(euros * 100),
		method,
		note,
	});
	await recomputeBookingPaid(bookingId);
	revalidateBooking(bookingId);
}

/** Quick-settle: record a single payment for whatever is still owed (or
 * the full total if nothing's paid). Used by the "Paid · cash/card"
 * shortcut buttons. Bound with both args, so formData arrives last. */
export async function settleBooking(
	bookingId: number,
	method: Method,
	_formData?: FormData,
) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	const [b] = await db
		.select()
		.from(schema.bookings)
		.where(eq(schema.bookings.id, bookingId))
		.limit(1);
	if (!b) throw new Error("Booking not found");
	const billedCents = Math.round((b.finalTotal ?? b.estimatedTotal ?? 0) * 100);
	const paid = await db
		.select()
		.from(schema.bookingPayments)
		.where(eq(schema.bookingPayments.bookingId, bookingId));
	const already = paid.reduce((s, p) => s + p.amountCents, 0);
	const remaining = Math.max(0, billedCents - already);
	const amount = remaining > 0 ? remaining : billedCents; // already settled → record full again only if nothing billed
	if (amount <= 0) return;
	await db.insert(schema.bookingPayments).values({
		bookingId,
		amountCents: amount,
		method,
	});
	await recomputeBookingPaid(bookingId);
	revalidateBooking(bookingId);
}

/**
 * Attach an orphan Stripe charge (a payment link made before bookingId
 * metadata existed, so the webhook could never place it) to this booking as a
 * card payment. Keyed on the charge so it's deduped against both a repeat tap
 * and any future webhook for the same charge.
 */
export async function linkStripeCharge(bookingId: number, formData: FormData) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	const chargeKey = String(formData.get("chargeKey") ?? "").trim();
	const amountCents = Number(formData.get("amountCents"));
	if (!chargeKey) throw new Error("Missing Stripe charge.");
	if (!Number.isFinite(amountCents) || amountCents <= 0) {
		throw new Error("Bad charge amount.");
	}
	const existing = await db
		.select({ id: schema.bookingPayments.id })
		.from(schema.bookingPayments)
		.where(
			and(
				eq(schema.bookingPayments.bookingId, bookingId),
				eq(schema.bookingPayments.stripeChargeId, chargeKey),
			),
		)
		.limit(1);
	if (existing.length === 0) {
		await db.insert(schema.bookingPayments).values({
			bookingId,
			amountCents,
			method: "card",
			stripeChargeId: chargeKey,
			note: "Linked Stripe payment",
		});
		await recomputeBookingPaid(bookingId);
	}
	revalidateBooking(bookingId);
}

/** Remove a single payment (mistake / refund logged elsewhere). */
export async function removePayment(paymentId: number, bookingId: number) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	await db
		.delete(schema.bookingPayments)
		.where(eq(schema.bookingPayments.id, paymentId));
	await recomputeBookingPaid(bookingId);
	revalidateBooking(bookingId);
}

/** Clear every payment on a booking — full reset of its paid state. */
export async function clearPayments(bookingId: number) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	await db
		.delete(schema.bookingPayments)
		.where(eq(schema.bookingPayments.bookingId, bookingId));
	await recomputeBookingPaid(bookingId);
	revalidateBooking(bookingId);
}
