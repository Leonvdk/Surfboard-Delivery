"use client";

import { useTransition } from "react";
import type { BookingStatus } from "../../lib/db/schema";
import { updateBookingStatus } from "../_actions";

interface Props {
	bookingId: number;
	current: BookingStatus;
}

const TRANSITION: Partial<Record<BookingStatus, { next: BookingStatus; label: string }>> = {
	requested: { next: "confirmed", label: "Confirm booking" },
	confirmed: { next: "in_progress", label: "Mark delivered" },
	in_progress: { next: "completed", label: "Mark returned" },
};

export function QuickStatusButtons({ bookingId, current }: Props) {
	const [pending, startTransition] = useTransition();
	const transition = TRANSITION[current];
	if (!transition) return null;

	return (
		<div className="quick-status">
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
