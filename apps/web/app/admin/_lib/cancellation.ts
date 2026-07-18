// Cancellation window rules mirror the customer-facing terms:
//   Free cancellation within 72h of booking.
//   No cancellation once the start of the booking is within 7 days.
// Between those windows: case-by-case.

import { daysBetween, todayIso } from "./dates";

export interface CancellationState {
	phase: "cooling_off" | "middle" | "cutoff" | "past";
	label: string;
	detail: string;
}

const COOLING_OFF_HOURS = 72;
const CUTOFF_DAYS = 7;

export function computeCancellationState(
	createdAt: Date,
	checkinIso: string,
): CancellationState {
	const now = Date.now();
	const hoursSinceBooking = (now - createdAt.getTime()) / 3_600_000;
	const daysUntilCheckin = daysBetween(todayIso(), checkinIso);

	if (daysUntilCheckin < 0) {
		return {
			phase: "past",
			label: "Past start date",
			detail: `Delivery was ${Math.abs(daysUntilCheckin)}d ago`,
		};
	}

	if (hoursSinceBooking < COOLING_OFF_HOURS) {
		const remaining = COOLING_OFF_HOURS - hoursSinceBooking;
		const hh = Math.floor(remaining);
		const mm = Math.round((remaining - hh) * 60);
		return {
			phase: "cooling_off",
			label: "Free-cancel window open",
			detail: `Ends in ${hh}h ${mm}m`,
		};
	}

	if (daysUntilCheckin <= CUTOFF_DAYS) {
		return {
			phase: "cutoff",
			label: "Locked in — no cancel",
			detail: `Delivery in ${daysUntilCheckin} day${daysUntilCheckin === 1 ? "" : "s"}`,
		};
	}

	return {
		phase: "middle",
		label: "Case-by-case",
		detail: `Delivery in ${daysUntilCheckin} days · past 72h cooling-off`,
	};
}
