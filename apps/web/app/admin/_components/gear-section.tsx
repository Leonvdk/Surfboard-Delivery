"use client";

import { type ReactNode, useState } from "react";

/**
 * A fleet section (Boards / Wetsuits / Other gear) as a collapsible block:
 * the table starts collapsed so the page is a quick overview, and a "+" on
 * the title line reveals the add form inline — no more always-open add cards.
 */
export function GearSection({
	title,
	count,
	summary,
	addForm,
	children,
	defaultOpen = false,
}: {
	title: string;
	count: number;
	/** Short right-aligned hint shown in the header, e.g. "3 free today". */
	summary?: string;
	addForm: ReactNode;
	children: ReactNode;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen);
	const [adding, setAdding] = useState(false);

	return (
		<section className="admin-gear-section">
			<div className="admin-gear-head">
				<button
					type="button"
					className="admin-gear-toggle"
					onClick={() => setOpen((v) => !v)}
					aria-expanded={open}
				>
					<span className="admin-gear-chevron" aria-hidden="true">
						{open ? "▾" : "▸"}
					</span>
					<h2>{title}</h2>
					<span className="admin-gear-count">{count}</span>
					{summary && <span className="admin-gear-summary">{summary}</span>}
				</button>
				<button
					type="button"
					className="admin-gear-add"
					onClick={() => setAdding((v) => !v)}
					aria-expanded={adding}
					aria-label={`Add — ${title}`}
					title={`Add — ${title}`}
				>
					{adding ? "×" : "+"}
				</button>
			</div>

			{adding && <div className="admin-gear-addform">{addForm}</div>}
			{open && <div className="admin-gear-body">{children}</div>}
		</section>
	);
}
