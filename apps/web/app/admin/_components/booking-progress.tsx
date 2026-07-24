import type { Booking } from "../../lib/db/schema";
import { BOOKING_STAGES, bookingStageIndex } from "../_lib/booking-stage";

/**
 * Brand-style lifecycle stepper for the booking detail page: numbered
 * squares joined by a track, filled up to the reached stage. Pure
 * server-rendered markup — no client JS.
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

	return (
		<ol className="booking-progress" aria-label="Booking progress">
			{BOOKING_STAGES.map((stage, i) => {
				const state =
					i < reached ? "done" : i === reached ? "current" : "todo";
				return (
					<li key={stage.key} className={`booking-progress-step booking-progress-step--${state}`}>
						<span className="booking-progress-marker" aria-hidden="true">
							{i < reached ? (
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							) : (
								i + 1
							)}
						</span>
						<span className="booking-progress-label">{stage.label}</span>
					</li>
				);
			})}
		</ol>
	);
}
