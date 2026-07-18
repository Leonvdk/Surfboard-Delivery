"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteBooking } from "../_actions";

interface Props {
	bookingId: number;
	customerName: string;
}

export function DeleteBookingButton({ bookingId, customerName }: Props) {
	const [confirming, setConfirming] = useState(false);
	const [pending, startTransition] = useTransition();

	// Auto-reset the confirming state after 5s of inactivity so the button
	// doesn't sit primed indefinitely if Leon walks away from the page.
	useEffect(() => {
		if (!confirming) return;
		const t = setTimeout(() => setConfirming(false), 5000);
		return () => clearTimeout(t);
	}, [confirming]);

	if (confirming) {
		return (
			<div className="delete-booking-confirm">
				<span className="delete-booking-question">
					Delete booking for <strong>{customerName}</strong>?
				</span>
				<button
					type="button"
					className="admin-btn delete-booking-confirm-yes"
					disabled={pending}
					onClick={() => {
						startTransition(async () => {
							await deleteBooking(bookingId);
						});
					}}
				>
					{pending ? "Deleting…" : "Yes, delete"}
				</button>
				<button
					type="button"
					className="admin-btn"
					disabled={pending}
					onClick={() => setConfirming(false)}
				>
					Keep it
				</button>
			</div>
		);
	}

	return (
		<button
			type="button"
			className="admin-btn delete-booking-trigger"
			onClick={() => setConfirming(true)}
		>
			Delete booking
		</button>
	);
}
