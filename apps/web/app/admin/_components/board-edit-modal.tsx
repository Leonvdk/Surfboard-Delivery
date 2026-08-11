"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { BoardStatus, GearKind } from "../../lib/db/schema";
import { setBoardStatus, updateBoard } from "../_board-actions";
import { BOARD_SIZES, WETSUIT_SIZES } from "../_lib/gear-sizes";

/**
 * Edit-a-board modal, opened by clicking a fleet row (see ClickableGearRow) —
 * no navigation, per Leon's ask. Reuses the public site's .modal-overlay/.modal
 * shell so the look matches the calculators. Saving calls the same server
 * actions as before; the fleet list revalidates underneath.
 */

export interface EditableBoard {
	id: number;
	kind: GearKind;
	name: string;
	size: string;
	purchaseCost: number | null;
	purchaseDate: string | null;
	status: BoardStatus;
	notes: string | null;
}

const STATUSES: Array<{ value: BoardStatus; label: string }> = [
	{ value: "active", label: "Active" },
	{ value: "repair", label: "In repair" },
	{ value: "retired", label: "Retired" },
];

/** Controlled modal — render it when open, it calls onClose to dismiss. */
export function BoardEditModal({
	board,
	onClose,
}: {
	board: EditableBoard;
	onClose: () => void;
}) {
	const [saving, setSaving] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onEsc);
		return () => document.removeEventListener("keydown", onEsc);
	}, [onClose]);

	if (!mounted) return null;

	return createPortal(
		<div className="modal-overlay" onClick={onClose}>
			<dialog
				className="modal admin-board-modal"
				open
				onClick={(e) => e.stopPropagation()}
				aria-label={`Edit ${board.name}`}
			>
				<div className="modal-header">
					<h3 className="modal-title">{board.name}</h3>
					<button
						className="modal-close"
						onClick={onClose}
						aria-label="Close"
						type="button"
					>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
				<div className="modal-body">
					<form
						className="admin-board-form"
						action={async (formData: FormData) => {
							setSaving(true);
							try {
								await updateBoard(board.id, formData);
								onClose();
							} finally {
								setSaving(false);
							}
						}}
					>
						<label>
							Name
							<input
								type="text"
								name="name"
								required
								defaultValue={board.name}
								className="admin-input"
							/>
						</label>
						<div className="admin-board-form-grid">
							{board.kind === "other" ? (
								<input type="hidden" name="size" value={board.size} />
							) : (
								<label>
									Size
									<select
										name="size"
										required
										defaultValue={board.size}
										className="admin-input"
									>
										{(board.kind === "board" ? BOARD_SIZES : WETSUIT_SIZES).map(
											(s) => (
												<option key={s} value={s}>
													{s}
												</option>
											),
										)}
									</select>
								</label>
							)}
							<label>
								Cost (€)
								<input
									type="number"
									name="purchaseCost"
									min="0"
									defaultValue={board.purchaseCost ?? ""}
									className="admin-input"
								/>
							</label>
							<label>
								Purchased on
								<input
									type="date"
									name="purchaseDate"
									defaultValue={board.purchaseDate ?? ""}
									className="admin-input"
								/>
							</label>
						</div>
						<label>
							Notes
							<textarea
								name="notes"
								rows={3}
								defaultValue={board.notes ?? ""}
								className="admin-textarea"
								placeholder="Dings, quirks, repairs..."
							/>
						</label>
						<button type="submit" className="admin-btn" disabled={saving}>
							{saving ? "Saving..." : "Save"}
						</button>
					</form>

					<div className="admin-board-modal-status">
						<h4>Status</h4>
						<div className="admin-board-status-row">
							{STATUSES.map((s) => (
								<button
									key={s.value}
									type="button"
									className={`admin-btn admin-board-status-btn${board.status === s.value ? " admin-board-status-btn--current" : ""}`}
									disabled={board.status === s.value || saving}
									onClick={async () => {
										setSaving(true);
										try {
											await setBoardStatus(board.id, s.value);
											onClose();
										} finally {
											setSaving(false);
										}
									}}
								>
									{s.label}
								</button>
							))}
						</div>
						<p className="admin-card-hint">
							Repair / retired boards drop out of availability but keep their
							history.
						</p>
					</div>
				</div>
			</dialog>
		</div>,
		document.body,
	);
}
