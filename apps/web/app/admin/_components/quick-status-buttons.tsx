"use client";

import { useTransition } from "react";
import type { BookingStatus } from "../../lib/db/schema";
import { updateBookingStatus } from "../_actions";

interface Props {
	bookingId: number;
	current: BookingStatus;
}

/**
 * One-click status moves. "requested" is deliberately absent: answering
 * a request means pricing it, minting the payment link and emailing the
 * customer, which the Confirm & send flow does in one pass. A bare
 * status flip here would quietly skip all three.
 */
const TRANSITION: Partial<Record<BookingStatus, { next: BookingStatus; label: string }>> = {
	confirmed: { next: "in_progress", label: "Mark delivered" },
	in_progress: { next: "completed", label: "Mark returned" },
};

export function QuickStatusButtons({ bookingId, current }: Props) {
	const [pending, startTransition] = useTransition();
	const transition = TRANSITION[current];
	if (!transition && current !== "requested") return null;

	return (
		<div className="quick-status">
			{transition && (
				<button
					type="button"
					className="admin-btn admin-btn--primary"
					disabled={pending}
					onClick={() => {
						startTransition(async () => {
							await updateBookingStatus(bookingId, transition.next);
						});
					}}
				>
					{pending ? "Saving…" : `${transition.label} →`}
				</button>
			)}
			{current === "requested" && (
				<button
					type="button"
					className="admin-btn"
					disabled={pending}
					onClick={() => {
						startTransition(async () => {
							await updateBookingStatus(bookingId, "cancelled");
						});
					}}
				>
					Cancel
				</button>
			)}
		</div>
	);
}
