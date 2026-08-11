"use client";

import { useState } from "react";
import { BoardEditModal, type EditableBoard } from "./board-edit-modal";

/**
 * A fleet table row that opens the edit modal on click/tap — no edit button.
 * Clicks that start on a real control (the board-name link, the "out on
 * booking" link) are ignored so those keep working. Mirrors
 * ClickableBookingRow, but opens a modal instead of navigating.
 */
export function ClickableGearRow({
	board,
	children,
}: {
	board: EditableBoard;
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);

	function isInteractive(target: EventTarget | null): boolean {
		// NOTE: no [role='button'] here — the <tr> itself carries role="button",
		// so closest() would match the row on every click and swallow it.
		return Boolean(
			target instanceof Element &&
				target.closest("a, button, select, input, textarea, label"),
		);
	}

	return (
		<tr
			className="admin-row-clickable"
			onClick={(e) => {
				if (isInteractive(e.target)) return;
				setOpen(true);
			}}
			onKeyDown={(e) => {
				if ((e.key === "Enter" || e.key === " ") && !isInteractive(e.target)) {
					e.preventDefault();
					setOpen(true);
				}
			}}
			tabIndex={0}
			role="button"
			aria-label={`Edit ${board.name}`}
		>
			{children}
			{open && <BoardEditModal board={board} onClose={() => setOpen(false)} />}
		</tr>
	);
}
