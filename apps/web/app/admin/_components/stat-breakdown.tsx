"use client";

import Link from "next/link";
import { type ReactNode, useRef } from "react";

/**
 * One line in a stat breakdown. `amount` and `sub` are pre-formatted on the
 * server (strings), so this component stays a dumb, serializable renderer.
 */
export interface BreakdownRow {
	label: string;
	sub?: string;
	amount: string;
	href?: string;
}

/**
 * A revenue KPI / P&L tile that is also a button: tapping it opens a modal
 * itemising exactly what makes up the number. The tile's visible content is
 * passed as children (rendered on the server); the breakdown rows come in as
 * plain data. Turns "why is billed €320?" into a one-tap answer.
 */
export function StatBreakdown({
	title,
	triggerClassName,
	children,
	rows,
	empty,
	footnote,
	total,
	totalLabel = "Total",
}: {
	title: string;
	triggerClassName: string;
	children: ReactNode;
	rows: BreakdownRow[];
	empty: string;
	footnote?: string;
	total?: string;
	totalLabel?: string;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	const close = () => ref.current?.close();

	return (
		<>
			<button
				type="button"
				className={`${triggerClassName} admin-stat--clickable`}
				onClick={() => ref.current?.showModal()}
			>
				{children}
				<span className="admin-stat-chevron" aria-hidden="true">
					›
				</span>
			</button>
			{/* Backdrop click (target === the dialog element, outside the inner
			    panel) closes it. Keyboard users get native <dialog> Escape, so no
			    key handler is needed. */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: native <dialog> Escape covers keyboard dismissal. */}
			<dialog
				ref={ref}
				className="admin-modal"
				onClick={(e) => {
					if (e.target === ref.current) close();
				}}
			>
				<div className="admin-modal-inner">
					<header className="admin-modal-header">
						<h3>{title}</h3>
						<button type="button" className="admin-modal-close" onClick={close} aria-label="Close">
							×
						</button>
					</header>

					{rows.length === 0 ? (
						<p className="admin-empty-inline">{empty}</p>
					) : (
						<ul className="admin-breakdown-list">
							{rows.map((r, i) => (
								// Static, non-reorderable list rendered once per open;
								// labels can repeat (two bookings, same name), so the index
								// keeps keys unique.
								// biome-ignore lint/suspicious/noArrayIndexKey: static list, duplicate labels possible.
								<li key={`${r.label}-${i}`} className="admin-breakdown-row">
									<div className="admin-breakdown-main">
										{r.href ? (
											<Link href={r.href} className="admin-breakdown-label">
												{r.label}
											</Link>
										) : (
											<span className="admin-breakdown-label">{r.label}</span>
										)}
										{r.sub && <span className="admin-breakdown-sub">{r.sub}</span>}
									</div>
									<span className="admin-breakdown-amount">{r.amount}</span>
								</li>
							))}
						</ul>
					)}

					{total && (
						<div className="admin-breakdown-total">
							<span>{totalLabel}</span>
							<strong>{total}</strong>
						</div>
					)}
					{footnote && <p className="admin-card-hint">{footnote}</p>}
				</div>
			</dialog>
		</>
	);
}
