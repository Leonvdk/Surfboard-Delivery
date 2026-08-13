"use client";

import { useState } from "react";
import type { LinkCategory, MarketingLink } from "../../lib/db/schema";
import { deleteMarketingLink } from "../_link-actions";
import { CopyButton } from "./copy-button";

type Filter = "all" | LinkCategory;

const FILTERS: { key: Filter; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "social", label: "Social" },
	{ key: "marketing", label: "Marketing" },
	{ key: "partner", label: "Partner" },
	{ key: "referral", label: "Referral" },
];

/** Saved UTM links with category + tag filters, copy, and delete. */
export function LinksTable({ links }: { links: MarketingLink[] }) {
	const [filter, setFilter] = useState<Filter>("all");
	const [tag, setTag] = useState<string | null>(null);

	const shown = links.filter(
		(l) => (filter === "all" || l.category === filter) && (!tag || (l.tags ?? []).includes(tag)),
	);

	// Per-category counts drive the pill labels so Leon sees the mix at a glance.
	const counts = links.reduce<Record<string, number>>((acc, l) => {
		acc[l.category] = (acc[l.category] ?? 0) + 1;
		return acc;
	}, {});

	if (links.length === 0) {
		return <p className="admin-empty-inline">No links yet — build one above.</p>;
	}

	return (
		<>
			<div className="admin-link-filters" role="tablist" aria-label="Filter links by category">
				{FILTERS.map((f) => {
					const count = f.key === "all" ? links.length : (counts[f.key] ?? 0);
					const active = filter === f.key;
					return (
						<button
							key={f.key}
							type="button"
							role="tab"
							aria-selected={active}
							className={`admin-link-filter${active ? " admin-link-filter--active" : ""}`}
							onClick={() => setFilter(f.key)}
						>
							{f.label}
							<span className="admin-link-filter-count">{count}</span>
						</button>
					);
				})}
				{tag && (
					<button
						type="button"
						className="admin-link-filter admin-link-filter--tag"
						onClick={() => setTag(null)}
						title="Clear tag filter"
					>
						#{tag} ✕
					</button>
				)}
			</div>

			{shown.length === 0 ? (
				<p className="admin-empty-inline">Nothing matches that filter.</p>
			) : (
				<div className="admin-table-wrap">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Campaign</th>
								<th>Category</th>
								<th>Tags</th>
								<th>Link</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{shown.map((l) => (
								<tr key={l.id}>
									<td>
										<span className="admin-cell-strong">{l.campaign}</span>
										<span className="admin-cell-muted admin-link-source">{l.source}</span>
									</td>
									<td>
										<span className={`admin-cat admin-cat--${l.category}`}>{l.category}</span>
									</td>
									<td>
										{(l.tags ?? []).length > 0 ? (
											<div className="admin-tag-row">
												{(l.tags ?? []).map((t) => (
													<button
														key={t}
														type="button"
														className={`admin-tag${tag === t ? " admin-tag--active" : ""}`}
														onClick={() => setTag(tag === t ? null : t)}
													>
														{t}
													</button>
												))}
											</div>
										) : (
											<span className="admin-cell-muted">—</span>
										)}
									</td>
									<td>
										<div className="admin-partner-cell">
											<code className="admin-link-url" title={l.url}>
												{l.destination}
											</code>
											<CopyButton value={l.url} label="copy link" />
										</div>
									</td>
									<td>
										<form action={deleteMarketingLink.bind(null, l.id)}>
											<button
												type="submit"
												className="admin-board-remove"
												aria-label={`Delete ${l.source} ${l.campaign} link`}
											>
												delete
											</button>
										</form>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</>
	);
}
