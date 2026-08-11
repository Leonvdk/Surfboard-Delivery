"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** €X from integer cents, no trailing .00. */
function eur(cents: number): string {
	const v = cents / 100;
	return `€${Number.isInteger(v) ? v : v.toFixed(2)}`;
}

export interface PaybackItem {
	id: number;
	name: string;
	costCents: number | null;
	collectedCents: number;
}

/**
 * Fleet payback: total collected vs total invested, as a clickable stat.
 * The modal has two tabs — Top earners (most collected first) and Still to
 * recoup (bought gear that hasn't yet earned back its cost).
 */
export function FleetPayback({
	collectedCents,
	investedCents,
	items,
}: {
	collectedCents: number;
	investedCents: number;
	items: PaybackItem[];
}) {
	const [open, setOpen] = useState(false);
	const [tab, setTab] = useState<"earners" | "recoup">("earners");
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	useEffect(() => {
		if (!open) return;
		const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
		document.addEventListener("keydown", onEsc);
		return () => document.removeEventListener("keydown", onEsc);
	}, [open]);

	const pct = investedCents > 0 ? Math.round((collectedCents / investedCents) * 100) : null;

	const earners = [...items]
		.filter((i) => i.collectedCents > 0)
		.sort((a, b) => b.collectedCents - a.collectedCents);
	const recoup = items
		.filter((i) => i.costCents != null && i.collectedCents < i.costCents)
		.map((i) => ({ ...i, remainingCents: (i.costCents ?? 0) - i.collectedCents }))
		.sort((a, b) => b.remainingCents - a.remainingCents);

	return (
		<>
			<button
				type="button"
				className="fleet-stat fleet-stat--link"
				onClick={() => setOpen(true)}
			>
				<span className="fleet-stat-kicker">Fleet payback</span>
				<span className="fleet-stat-value">{pct != null ? `${pct}%` : "—"}</span>
				<span className="fleet-stat-sub">
					{eur(collectedCents)} earned · {eur(investedCents)} invested
				</span>
			</button>

			{open &&
				mounted &&
				createPortal(
					<div className="modal-overlay" onClick={() => setOpen(false)}>
						<dialog
							className="modal admin-board-modal"
							open
							onClick={(e) => e.stopPropagation()}
							aria-label="Fleet payback"
						>
							<div className="modal-header">
								<h3 className="modal-title">Fleet payback</h3>
								<button className="modal-close" onClick={() => setOpen(false)} aria-label="Close" type="button">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<line x1="18" y1="6" x2="6" y2="18" />
										<line x1="6" y1="6" x2="18" y2="18" />
									</svg>
								</button>
							</div>
							<div className="modal-body">
								<p className="fleet-payback-headline">
									<strong>{eur(collectedCents)}</strong> earned on{" "}
									<strong>{eur(investedCents)}</strong> invested
									{pct != null ? ` · ${pct}% recouped` : ""}
								</p>

								<div className="fleet-tabs" role="tablist">
									<button
										type="button"
										role="tab"
										aria-selected={tab === "earners"}
										className={`fleet-tab${tab === "earners" ? " fleet-tab--active" : ""}`}
										onClick={() => setTab("earners")}
									>
										Top earners
									</button>
									<button
										type="button"
										role="tab"
										aria-selected={tab === "recoup"}
										className={`fleet-tab${tab === "recoup" ? " fleet-tab--active" : ""}`}
										onClick={() => setTab("recoup")}
									>
										Still to recoup {recoup.length > 0 ? `(${recoup.length})` : ""}
									</button>
								</div>

								{tab === "earners" ? (
									<ul className="fleet-payback-list">
										{earners.length === 0 && (
											<li className="admin-empty-inline">No earnings recorded yet.</li>
										)}
										{earners.map((i) => (
											<li key={i.id} className="fleet-payback-row">
												<span>{i.name}</span>
												<span className="fleet-payback-amount">{eur(i.collectedCents)}</span>
											</li>
										))}
									</ul>
								) : (
									<ul className="fleet-payback-list">
										{recoup.length === 0 && (
											<li className="admin-empty-inline">
												Every piece with a cost has paid for itself. Nice.
											</li>
										)}
										{recoup.map((i) => (
											<li key={i.id} className="fleet-payback-row">
												<span>{i.name}</span>
												<span className="fleet-payback-amount fleet-payback-amount--owed">
													{eur(i.remainingCents)} to go
												</span>
											</li>
										))}
									</ul>
								)}
							</div>
						</dialog>
					</div>,
					document.body,
				)}
		</>
	);
}
