"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { BookingStatus } from "../../lib/db/schema";
import { updateBookingStatus } from "../_actions";
import {
	currentStageLabel,
	SETTABLE_STATUSES as STATUSES,
} from "../_lib/booking-stage";

interface Props {
	bookingId: number;
	current: BookingStatus;
	/** Payment state, so the tag can show the same lifecycle stage the
	 * booking page's stepper does instead of the raw status enum. Omitted
	 * on surfaces that only know the status (the detail page's own
	 * picker, where the stepper already sits right above it). */
	hasPaymentLink?: boolean;
	paid?: boolean;
	late?: boolean;
}

export function StatusPicker({
	bookingId,
	current,
	hasPaymentLink,
	paid,
	late,
}: Props) {
	const [status, setStatus] = useState<BookingStatus>(current);
	const [open, setOpen] = useState(false);
	const [pending, startTransition] = useTransition();
	const rootRef = useRef<HTMLDivElement>(null);

	// Keep state in sync when the server sends new props (after revalidate).
	useEffect(() => {
		setStatus(current);
	}, [current]);

	// Close menu on outside click or Escape.
	useEffect(() => {
		if (!open) return;
		function onDocClick(e: MouseEvent) {
			if (!rootRef.current) return;
			if (rootRef.current.contains(e.target as Node)) return;
			setOpen(false);
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onDocClick);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDocClick);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	function pick(next: BookingStatus) {
		if (next === status) {
			setOpen(false);
			return;
		}
		const previous = status;
		setStatus(next); // optimistic
		setOpen(false);
		startTransition(async () => {
			try {
				await updateBookingStatus(bookingId, next);
			} catch (_err) {
				setStatus(previous); // rollback on failure
			}
		});
	}

	// The tag shows the lifecycle stage (Awaiting payment, Payment
	// confirmed …) so scanning the table tells Leon the same thing the
	// booking page does. The menu still sets the underlying status —
	// that's the part that's actually settable. Recomputed from local
	// state so an optimistic status change relabels instantly.
	const showStage = hasPaymentLink !== undefined;
	const isLate = Boolean(late) && status === "in_progress";
	const triggerLabel = showStage
		? currentStageLabel(
				{
					status,
					hasPaymentLink: Boolean(hasPaymentLink),
					paid: Boolean(paid),
				},
				isLate,
			)
		: (STATUSES.find((s) => s.value === status)?.label ??
			status.charAt(0).toUpperCase() + status.slice(1));

	return (
		<div ref={rootRef} className="status-picker">
			<button
				type="button"
				className={`admin-status admin-status--${status}${isLate ? " admin-status--late" : ""} status-picker-trigger${pending ? " status-picker-trigger--pending" : ""}`}
				onClick={() => setOpen((v) => !v)}
				aria-haspopup="listbox"
				aria-expanded={open}
				title="Click to change status"
			>
				{triggerLabel}
			</button>
			{open && (
				<div className="status-picker-menu" role="listbox">
					{STATUSES.map((s) => (
						<button
							key={s.value}
							type="button"
							className={`admin-status admin-status--${s.value} status-picker-option${s.value === status ? " status-picker-option--current" : ""}`}
							onClick={() => pick(s.value)}
							role="option"
							aria-selected={s.value === status}
						>
							{s.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
