"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { BookingStatus } from "../../lib/db/schema";
import { updateBookingStatus } from "../_actions";
import {
	currentStageKey,
	currentStageLabel,
	STAGE_MENU,
} from "../_lib/booking-stage";

interface Props {
	bookingId: number;
	current: BookingStatus;
	/** Payment state, so the tag and menu show the same lifecycle stage
	 * the booking page's stepper does instead of the raw status enum. */
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

	// Tag and menu both speak stages, so a booking never reads one way in
	// the tag and another in the menu under it. Recomputed from local
	// state so an optimistic status change relabels instantly.
	const inputs = {
		status,
		hasPaymentLink: Boolean(hasPaymentLink),
		paid: Boolean(paid),
	};
	const isLate = Boolean(late) && status === "in_progress";
	const stageKey = currentStageKey(inputs, isLate);
	const label = currentStageLabel(inputs, isLate);

	return (
		<div ref={rootRef} className="status-picker">
			<button
				type="button"
				className={`admin-status admin-status--stage-${stageKey} status-picker-trigger${pending ? " status-picker-trigger--pending" : ""}`}
				onClick={() => setOpen((v) => !v)}
				aria-haspopup="listbox"
				aria-expanded={open}
				title="Click to change status"
			>
				{label}
			</button>
			{open && (
				<div className="status-picker-menu" role="listbox">
					{STAGE_MENU.map((item) => {
						const isCurrent = item.key === stageKey;
						// Payment stages come from Stripe / the confirmation
						// email — shown for context, not clickable.
						const settable = item.status !== undefined;
						return (
							<button
								key={item.key}
								type="button"
								className={`admin-status admin-status--stage-${item.key} status-picker-option${isCurrent ? " status-picker-option--current" : ""}${settable ? "" : " status-picker-option--auto"}`}
								onClick={() => settable && pick(item.status as BookingStatus)}
								disabled={!settable}
								title={item.hint}
								role="option"
								aria-selected={isCurrent}
							>
								{item.label}
								{!settable && (
									<span className="status-picker-auto-tag">auto</span>
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
