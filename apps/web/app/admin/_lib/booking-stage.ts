import type { Booking } from "../../lib/db/schema";

/**
 * The customer-lifecycle stages Leon tracks, derived — not stored. The
 * status enum stays as-is (requested/confirmed/in_progress/completed);
 * the two payment stages come from the payment link and the webhook's
 * paidAt stamp, so nothing has to remember to flip extra flags:
 *
 *   requested          booking exists
 *   answered           Leon confirmed (status ≥ confirmed)
 *   payment requested  a Stripe payment link exists on the booking
 *   payment confirmed  webhook stamped paidAt
 *   in progress        gear is out (status in_progress)
 *   completed          status completed
 *
 * A booking without a payment link (pay on delivery) skips the payment
 * stages when it advances: reaching "in progress" marks earlier stages
 * done. Cancelled bookings don't get a stepper at all.
 */

export const BOOKING_STAGES = [
	{ key: "requested", label: "Requested" },
	{ key: "answered", label: "Answered" },
	{ key: "payment_requested", label: "Payment requested" },
	{ key: "payment_confirmed", label: "Payment confirmed" },
	{ key: "in_progress", label: "In progress" },
	{ key: "completed", label: "Completed" },
] as const;

export type BookingStageKey = (typeof BOOKING_STAGES)[number]["key"];

/** Index of the furthest stage this booking has reached, or null for cancelled. */
export function bookingStageIndex(booking: Booking): number | null {
	if (booking.status === "cancelled") return null;

	let reached = 0; // requested — it exists
	if (
		booking.status === "confirmed" ||
		booking.status === "in_progress" ||
		booking.status === "completed"
	) {
		reached = Math.max(reached, 1);
	}
	if (booking.stripePaymentLinkUrl) reached = Math.max(reached, 2);
	if (booking.paidAt) reached = Math.max(reached, 3);
	if (booking.status === "in_progress") reached = Math.max(reached, 4);
	if (booking.status === "completed") reached = Math.max(reached, 5);
	return reached;
}
