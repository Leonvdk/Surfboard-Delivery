import type { Booking } from "../../lib/db/schema";

/**
 * The customer-lifecycle stages Leon tracks, derived — not stored. The
 * status enum stays as-is (requested/confirmed/in_progress/completed);
 * the payment stages come from the payment link, the confirmation-email
 * stamp, and the webhook's paidAt, so nothing has to remember to flip
 * extra flags:
 *
 *   requested          booking exists
 *   answered           Leon confirmed (status ≥ confirmed)
 *   payment requested  a Stripe payment link exists on the booking
 *   awaiting payment   the confirmation email carrying that link was sent
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
	{ key: "awaiting_payment", label: "Awaiting payment" },
	{ key: "payment_confirmed", label: "Payment confirmed" },
	{ key: "in_progress", label: "In progress" },
	{ key: "completed", label: "Completed" },
] as const;

export type BookingStageKey = (typeof BOOKING_STAGES)[number]["key"];

const IN_PROGRESS_INDEX = 5;

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
	// Awaiting payment = the link went out and the customer hasn't paid.
	if (booking.stripePaymentLinkUrl && booking.confirmationSentAt) {
		reached = Math.max(reached, 3);
	}
	if (booking.paidAt) reached = Math.max(reached, 4);
	if (booking.status === "in_progress") reached = Math.max(reached, IN_PROGRESS_INDEX);
	if (booking.status === "completed") reached = Math.max(reached, 6);
	return reached;
}

/**
 * A booking is LATE when the gear is still out past its pickup day.
 * Uses the envelope checkout (the last person's pickup) so a staggered
 * party isn't flagged while someone legitimately still has boards.
 */
export function isBookingLate(booking: Booking, todayIso: string): boolean {
	return booking.status === "in_progress" && booking.checkout < todayIso;
}

/** Stage label, swapped to LATE when pickup is overdue. */
export function stageLabel(
	stageKey: BookingStageKey,
	booking: Booking,
	todayIso: string,
): string {
	if (stageKey === "in_progress" && isBookingLate(booking, todayIso)) {
		return "Late";
	}
	return BOOKING_STAGES.find((s) => s.key === stageKey)?.label ?? stageKey;
}
