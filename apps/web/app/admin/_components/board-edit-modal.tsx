"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { BoardStatus } from "../../lib/db/schema";
import { setBoardStatus, updateBoard } from "../_board-actions";

/**
 * Edit-a-board modal, opened from the fleet list — no navigation, per
 * Leon's ask. Reuses the public site's .modal-overlay/.modal shell so
 * the look matches the board/wetsuit calculators. Saving calls the same
 * server actions as before; the fleet list revalidates underneath.
 */

export interface EditableBoard {
	id: number;
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

export function BoardEditButton({ board }: { board: EditableBoard }) {
	const [open, setOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		if (!open) return;
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("keydown", onEsc);
		return () => document.removeEventListener("keydown", onEsc);
	}, [open]);

	return (
		<>
			<button
				type="button"
				className="admin-row-link admin-row-link--btn"
				onClick={() => setOpen(true)}
			>
				Edit&nbsp;→
			</button>

			{open &&
				mounted &&
				createPortal(
					<div className="modal-overlay" onClick={() => setOpen(false)}>
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
									onClick={() => setOpen(false)}
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
											setOpen(false);
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
										<label>
											Size
											<select
												name="size"
												required
												defaultValue={board.size}
												className="admin-input"
											>
												<option value="6'6">6&apos;6</option>
												<option value="7'0">7&apos;0</option>
												<option value="7'8">7&apos;8</option>
												<option value="8'6">8&apos;6</option>
											</select>
										</label>
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
														setOpen(false);
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
										Repair / retired boards drop out of availability but keep
										their history.
									</p>
								</div>
							</div>
						</dialog>
					</div>,
					document.body,
				)}
		</>
	);
}
