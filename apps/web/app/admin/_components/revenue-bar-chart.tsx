"use client";

import { useState } from "react";

interface Point {
	day: string; // ISO YYYY-MM-DD
	cents: number;
}

interface Props {
	trend: Point[];
}

function formatDate(iso: string): string {
	if (!iso) return "";
	const d = new Date(`${iso}T00:00:00Z`);
	if (Number.isNaN(d.getTime())) return iso;
	const day = d.getUTCDate();
	const month = d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
	const year2 = String(d.getUTCFullYear() % 100).padStart(2, "0");
	return `${day} ${month} '${year2}`;
}

function formatEuros(cents: number): string {
	return `€${(cents / 100).toFixed(2)}`;
}

export function RevenueBarChart({ trend }: Props) {
	const [hoverIdx, setHoverIdx] = useState<number | null>(null);

	if (trend.length === 0) {
		return <p className="admin-empty-inline">No data in this window.</p>;
	}

	const maxCents = Math.max(1, ...trend.map((d) => d.cents));
	const hover = hoverIdx !== null ? trend[hoverIdx] : null;

	return (
		<div className="revenue-chart">
			{hover && (
				<div
					className="revenue-chart-tooltip"
					style={{
						left: `${((hoverIdx! + 0.5) / trend.length) * 100}%`,
					}}
				>
					<div className="revenue-chart-tooltip-date">{formatDate(hover.day)}</div>
					<div className="revenue-chart-tooltip-value">{formatEuros(hover.cents)}</div>
				</div>
			)}

			<div className="revenue-chart-bars" role="img" aria-label="Daily net revenue">
				{trend.map((d, i) => {
					const heightPct = (d.cents / maxCents) * 100;
					const isHover = hoverIdx === i;
					return (
						<button
							key={d.day}
							type="button"
							className={`revenue-chart-bar-col${isHover ? " revenue-chart-bar-col--hover" : ""}`}
							onMouseEnter={() => setHoverIdx(i)}
							onMouseLeave={() => setHoverIdx(null)}
							onFocus={() => setHoverIdx(i)}
							onBlur={() => setHoverIdx(null)}
							aria-label={`${formatDate(d.day)}: ${formatEuros(d.cents)}`}
						>
							<div
								className="revenue-chart-bar"
								style={{ height: `${heightPct}%` }}
							/>
						</button>
					);
				})}
			</div>
		</div>
	);
}
