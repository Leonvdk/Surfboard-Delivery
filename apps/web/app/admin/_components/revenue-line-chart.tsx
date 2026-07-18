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

const CHART_W = 1000; // viewBox width
const CHART_H = 200; // viewBox height
const PAD_TOP = 16;
const PAD_BOTTOM = 20;

export function RevenueLineChart({ trend }: Props) {
	const [hoverIdx, setHoverIdx] = useState<number | null>(null);

	if (trend.length === 0) {
		return <p className="admin-empty-inline">No data in this window.</p>;
	}

	const maxCents = Math.max(1, ...trend.map((d) => d.cents));

	// Give a single-point window something reasonable to render
	const denominator = Math.max(1, trend.length - 1);

	const points = trend.map((d, i) => {
		const x = (i / denominator) * CHART_W;
		const y =
			CHART_H -
			PAD_BOTTOM -
			(d.cents / maxCents) * (CHART_H - PAD_TOP - PAD_BOTTOM);
		return { x, y, day: d.day, cents: d.cents };
	});

	const linePath = points
		.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
		.join(" ");

	// Area under the curve (subtle fill)
	const areaPath =
		linePath +
		` L ${CHART_W} ${CHART_H - PAD_BOTTOM} L 0 ${CHART_H - PAD_BOTTOM} Z`;

	// Column width for the mouse hit area (in %)
	const colWidthPct = 100 / trend.length;

	const hover = hoverIdx !== null ? points[hoverIdx] : null;

	return (
		<div className="revenue-chart">
			{hover && (
				<div
					className="revenue-chart-tooltip"
					style={{
						left: `${(hover.x / CHART_W) * 100}%`,
					}}
				>
					<div className="revenue-chart-tooltip-date">{formatDate(hover.day)}</div>
					<div className="revenue-chart-tooltip-value">{formatEuros(hover.cents)}</div>
				</div>
			)}

			<svg
				viewBox={`0 0 ${CHART_W} ${CHART_H}`}
				preserveAspectRatio="none"
				className="revenue-chart-svg"
				aria-label="Daily net revenue"
				role="img"
			>
				{/* Baseline */}
				<line
					x1={0}
					y1={CHART_H - PAD_BOTTOM}
					x2={CHART_W}
					y2={CHART_H - PAD_BOTTOM}
					stroke="var(--gray-200)"
					strokeWidth={1}
					vectorEffect="non-scaling-stroke"
				/>

				{/* Subtle area under the curve */}
				<path d={areaPath} fill="var(--accent)" fillOpacity={0.08} />

				{/* Line */}
				<path
					d={linePath}
					fill="none"
					stroke="var(--accent)"
					strokeWidth={2}
					vectorEffect="non-scaling-stroke"
					strokeLinejoin="round"
					strokeLinecap="round"
				/>

				{/* Points */}
				{points.map((p, i) => (
					<circle
						key={p.day}
						cx={p.x}
						cy={p.y}
						r={hoverIdx === i ? 4 : 2}
						fill="var(--accent)"
						stroke="var(--surface)"
						strokeWidth={hoverIdx === i ? 2 : 0}
						vectorEffect="non-scaling-stroke"
					>
						<title>
							{formatDate(p.day)} · {formatEuros(p.cents)}
						</title>
					</circle>
				))}

				{/* Vertical hover line */}
				{hover && (
					<line
						x1={hover.x}
						y1={PAD_TOP}
						x2={hover.x}
						y2={CHART_H - PAD_BOTTOM}
						stroke="var(--gray-300)"
						strokeWidth={1}
						strokeDasharray="3 3"
						vectorEffect="non-scaling-stroke"
					/>
				)}
			</svg>

			{/* Invisible mouse hit-areas, one per day */}
			<div className="revenue-chart-hits">
				{points.map((p, i) => (
					<button
						key={p.day}
						type="button"
						className="revenue-chart-hit"
						style={{ width: `${colWidthPct}%` }}
						onMouseEnter={() => setHoverIdx(i)}
						onMouseLeave={() => setHoverIdx(null)}
						onFocus={() => setHoverIdx(i)}
						onBlur={() => setHoverIdx(null)}
						aria-label={`${formatDate(p.day)}: ${formatEuros(p.cents)}`}
					/>
				))}
			</div>
		</div>
	);
}
