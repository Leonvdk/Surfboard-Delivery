"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { BookingStatus } from "../../lib/db/schema";
import { updateBookingStatus } from "../_actions";

const STATUSES: Array<{ value: BookingStatus; label: string }> = [
	{ value: "requested", label: "Requested" },
	{ value: "confirmed", label: "Confirmed" },
	{ value: "completed", label: "Completed" },
	{ value: "cancelled", label: "Cancelled" },
];

interface Props {
	bookingId: number;
	current: BookingStatus;
}

export function StatusPicker({ bookingId, current }: Props) {
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

	return (
		<div ref={rootRef} className="status-picker">
			<button
				type="button"
				className={`admin-status admin-status--${status} status-picker-trigger${pending ? " status-picker-trigger--pending" : ""}`}
				onClick={() => setOpen((v) => !v)}
				aria-haspopup="listbox"
				aria-expanded={open}
				title="Click to change status"
			>
				{status.charAt(0).toUpperCase() + status.slice(1)}
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
