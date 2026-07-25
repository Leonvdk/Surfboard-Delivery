import type { Booking, BookingStatus } from "../../lib/db/schema";

/**
 * The customer-lifecycle stages Leon tracks, derived — not stored. The
 * status enum stays as-is (requested/confirmed/in_progress/completed);
 * the payment stages come from the payment link, the confirmation-email
 * stamp, and the webhook's paidAt, so nothing has to remember to flip
 * extra flags:
 *
 *   answered           Leon confirmed (status ≥ confirmed)
 *   payment requested  a Stripe payment link exists on the booking
 *   awaiting payment   the confirmation email carrying that link was sent
 *   payment confirmed  webhook stamped paidAt
 *   in progress        gear is out (status in_progress)
 *   completed          status completed
 *
 * There's deliberately no "requested" step — every booking exists, so it
 * would always be ticked and tells Leon nothing. A booking still waiting
 * on his yes/no simply hasn't reached stage 0 yet (index -1).
 *
 * A booking without a payment link (pay on delivery) skips the payment
 * stages when it advances: reaching "in progress" marks earlier stages
 * done. Cancelled bookings don't get a stepper at all.
 */

export const BOOKING_STAGES = [
	{ key: "answered", label: "Answered" },
	{ key: "payment_requested", label: "Payment requested" },
	{ key: "awaiting_payment", label: "Awaiting payment" },
	{ key: "payment_confirmed", label: "Payment confirmed" },
	{ key: "in_progress", label: "In progress" },
	{ key: "completed", label: "Completed" },
] as const;

export type BookingStageKey = (typeof BOOKING_STAGES)[number]["key"];

const IN_PROGRESS_INDEX = 4;
const COMPLETED_INDEX = 5;

/** The few fields a stage depends on — so the client-side status picker
 * can recompute optimistically without a whole Booking row. */
export interface StageInputs {
	status: BookingStatus;
	hasPaymentLink: boolean;
	confirmationSent: boolean;
	paid: boolean;
}

/**
 * Index of the furthest stage reached.
 *   null → cancelled (no stepper)
 *   -1   → still awaiting Leon's yes/no (nothing reached yet)
 */
export function stageIndexFrom(inputs: StageInputs): number | null {
	if (inputs.status === "cancelled") return null;
	if (inputs.status === "requested") return -1;

	let reached = 0; // answered — Leon confirmed it
	if (inputs.hasPaymentLink) reached = Math.max(reached, 1);
	// Awaiting payment = the link went out and the customer hasn't paid.
	if (inputs.hasPaymentLink && inputs.confirmationSent) {
		reached = Math.max(reached, 2);
	}
	if (inputs.paid) reached = Math.max(reached, 3);
	if (inputs.status === "in_progress") reached = Math.max(reached, IN_PROGRESS_INDEX);
	if (inputs.status === "completed") reached = Math.max(reached, COMPLETED_INDEX);
	return reached;
}

export function bookingStageIndex(booking: Booking): number | null {
	return stageIndexFrom(toStageInputs(booking));
}

export function toStageInputs(booking: Booking): StageInputs {
	return {
		status: booking.status,
		hasPaymentLink: Boolean(booking.stripePaymentLinkUrl),
		confirmationSent: Boolean(booking.confirmationSentAt),
		paid: Boolean(booking.paidAt),
	};
}

/**
 * A booking is LATE when the gear is still out past its pickup day.
 * Uses the envelope checkout (the last person's pickup) so a staggered
 * party isn't flagged while someone legitimately still has boards.
 */
export function isBookingLate(booking: Booking, todayIso: string): boolean {
	return booking.status === "in_progress" && booking.checkout < todayIso;
}

/**
 * One label for both the stepper and the bookings-table tag, so the two
 * always agree: cancelled / awaiting-decision / LATE / current stage.
 */
export function currentStageLabel(inputs: StageInputs, late = false): string {
	if (inputs.status === "cancelled") return "Cancelled";
	if (late) return "Late";
	const idx = stageIndexFrom(inputs);
	if (idx == null || idx < 0) return "Requested";
	return BOOKING_STAGES[idx]?.label ?? "Requested";
}
