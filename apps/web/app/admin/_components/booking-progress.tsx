import type { Booking } from "../../lib/db/schema";
import {
	BOOKING_STAGES,
	bookingStageIndex,
	isBookingLate,
} from "../_lib/booking-stage";
import { todayIso } from "../_lib/dates";

/**
 * Brand-style lifecycle stepper for the booking detail page: numbered
 * squares joined by a track, filled up to the reached stage. Pure
 * server-rendered markup — no client JS. When gear is out past its
 * pickup day the "In progress" step becomes a dark-red LATE.
 */
export function BookingProgress({ booking }: { booking: Booking }) {
	const reached = bookingStageIndex(booking);
	if (reached == null) {
		return (
			<div className="booking-progress booking-progress--cancelled">
				Booking cancelled
				{booking.paidAt ? " · payment was received — check refund" : ""}
			</div>
		);
	}

	const today = todayIso();
	const late = isBookingLate(booking, today);

	return (
		<ol className="booking-progress" aria-label="Booking progress">
			{/* reached === -1 (still awaiting Leon's yes/no) leaves every step
				"todo" — nothing is ticked until he answers. */}
			{BOOKING_STAGES.map((stage, i) => {
				const state = i < reached ? "done" : i === reached ? "current" : "todo";
				const isLateStep = stage.key === "in_progress" && late;
				// "Completed" is terminal — sitting on it means finished, so
				// it gets a tick rather than a step number.
				const ticked = i < reached || (i === reached && stage.key === "completed");
				return (
					<li
						key={stage.key}
						className={`booking-progress-step booking-progress-step--${state}${isLateStep ? " booking-progress-step--late" : ""}${ticked && state === "current" ? " booking-progress-step--terminal" : ""}`}
					>
						<span className="booking-progress-marker" aria-hidden="true">
							{isLateStep ? (
								"!"
							) : ticked ? (
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							) : state === "current" ? (
								<span className="booking-progress-dot" />
							) : (
								i + 1
							)}
						</span>
						<span className="booking-progress-label">
							{isLateStep ? "Late" : stage.label}
						</span>
					</li>
				);
			})}
		</ol>
	);
}
