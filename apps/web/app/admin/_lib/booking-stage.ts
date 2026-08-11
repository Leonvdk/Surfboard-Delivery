import type { Booking, BookingStatus } from "../../lib/db/schema";

/**
 * The single vocabulary for a booking's lifecycle, used by the stepper
 * on the booking page, the status tags and picker in the bookings
 * table, the filter chips, and the dashboard rows — so the same booking
 * never reads two different ways.
 *
 *   answered           Leon confirmed (status ≥ confirmed)
 *   awaiting payment   a Stripe payment link exists and isn't paid yet
 *   payment confirmed  a payment has come in — Stripe webhook OR a manually
 *                      recorded cash/card payment, even if it's partial or a
 *                      discounted amount (paidAt only sets on full settlement)
 *   in progress        gear is out (status in_progress)
 *   completed          status completed
 *
 * Deliberately absent:
 *   - "requested" as a step: every booking exists, so it would always be
 *     ticked. A booking still waiting on Leon's yes/no sits before stage
 *     0 (index -1), which reads as "needs an answer" without a step.
 *   - a separate "payment requested": minting the link and waiting for
 *     the money are the same state from Leon's side.
 *
 * A booking without a payment link (pay on delivery) skips the payment
 * stages: reaching "in progress" marks the earlier ones done.
 */

export const BOOKING_STAGES = [
	{ key: "answered", label: "Answered" },
	{ key: "awaiting_payment", label: "Awaiting payment" },
	{ key: "payment_confirmed", label: "Payment confirmed" },
	{ key: "in_progress", label: "In progress" },
	{ key: "completed", label: "Completed" },
] as const;

export type BookingStageKey = (typeof BOOKING_STAGES)[number]["key"];

const IN_PROGRESS_INDEX = 3;
const COMPLETED_INDEX = 4;

/** The few fields a stage depends on — so the client-side status picker
 * can recompute optimistically without a whole Booking row. */
export interface StageInputs {
	status: BookingStatus;
	hasPaymentLink: boolean;
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
	if (inputs.paid) reached = Math.max(reached, 2);
	if (inputs.status === "in_progress") reached = Math.max(reached, IN_PROGRESS_INDEX);
	if (inputs.status === "completed") reached = Math.max(reached, COMPLETED_INDEX);
	return reached;
}

export function bookingStageIndex(booking: Booking): number | null {
	return stageIndexFrom(toStageInputs(booking));
}

/**
 * True once any payment has come in. `paidAt` is the stricter "fully settled"
 * flag (payments ≥ billed) used for revenue — a discounted checkout or a
 * partial/deposit payment leaves it null but still records paidAmountCents.
 * The "payment confirmed" stage should tick as soon as money arrives, whether
 * from the Stripe webhook or a manually recorded cash/card payment.
 */
export function bookingHasPayment(b: {
	paidAt: Date | string | null;
	paidAmountCents: number | null;
}): boolean {
	return Boolean(b.paidAt) || (b.paidAmountCents ?? 0) > 0;
}

export function toStageInputs(booking: Booking): StageInputs {
	return {
		status: booking.status,
		hasPaymentLink: Boolean(booking.stripePaymentLinkUrl),
		paid: bookingHasPayment(booking),
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
 * One label for every surface: cancelled / awaiting-decision / LATE /
 * current stage.
 */
export function currentStageLabel(inputs: StageInputs, late = false): string {
	if (inputs.status === "cancelled") return "Cancelled";
	if (late) return "Late";
	const idx = stageIndexFrom(inputs);
	if (idx == null || idx < 0) return "Requested";
	return BOOKING_STAGES[idx]?.label ?? "Requested";
}

/**
 * The statuses Leon can actually set, labelled in the same vocabulary as
 * the stages. The payment stages aren't here — they come from Stripe and
 * the confirmation email, not from a menu.
 */
export const SETTABLE_STATUSES: Array<{
	value: BookingStatus;
	label: string;
}> = [
	{ value: "requested", label: "Requested" },
	{ value: "confirmed", label: "Answered" },
	{ value: "in_progress", label: "In progress" },
	{ value: "completed", label: "Completed" },
	{ value: "cancelled", label: "Cancelled" },
];

/** Status label in stage vocabulary — for filter chips and menus. */
export function statusLabel(status: BookingStatus): string {
	return (
		SETTABLE_STATUSES.find((s) => s.value === status)?.label ??
		status.replace("_", " ")
	);
}

/**
 * Every state a booking can display, in lifecycle order — the status
 * picker renders this whole list so the menu says the same words as the
 * tag above it. Entries without a `status` are set by Stripe / the
 * confirmation email rather than by Leon, and render disabled with the
 * reason as a tooltip.
 */
export const STAGE_MENU: Array<{
	key: string;
	label: string;
	status?: BookingStatus;
	hint?: string;
}> = [
	{ key: "requested", label: "Requested", status: "requested" },
	{ key: "answered", label: "Answered", status: "confirmed" },
	{
		key: "awaiting_payment",
		label: "Awaiting payment",
		hint: "Set automatically once a payment link exists on this booking",
	},
	{
		key: "payment_confirmed",
		label: "Payment confirmed",
		hint: "Set automatically once a payment is recorded — Stripe or a manual cash/card payment",
	},
	{ key: "in_progress", label: "In progress", status: "in_progress" },
	{ key: "completed", label: "Completed", status: "completed" },
	{ key: "cancelled", label: "Cancelled", status: "cancelled" },
];

/**
 * Slug for the booking's current state — drives both the menu's
 * "current" highlight and the tag colour, so one stage always looks and
 * reads the same everywhere.
 */
export function currentStageKey(inputs: StageInputs, late = false): string {
	if (inputs.status === "cancelled") return "cancelled";
	if (late) return "late";
	const idx = stageIndexFrom(inputs);
	if (idx == null || idx < 0) return "requested";
	return BOOKING_STAGES[idx]?.key ?? "requested";
}
