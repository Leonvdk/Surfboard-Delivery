"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * Horizontal scroller for the board-availability strip. When the month is
 * wider than the screen (phone, tablet), it starts scrolled so today's
 * column sits in the centre of the view instead of the month starting at
 * day 1. Does nothing when the viewed month doesn't contain today, or when
 * everything fits without scrolling.
 */
export function BoardStripScroll({ children }: { children: ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el || el.scrollWidth <= el.clientWidth) return;
		const today = el.querySelector<HTMLElement>(".admin-board-strip-day--today");
		if (!today) return;
		el.scrollLeft = Math.max(0, today.offsetLeft - (el.clientWidth - today.offsetWidth) / 2);
	}, []);

	return (
		<div className="admin-board-strip-scroll" ref={ref}>
			{children}
		</div>
	);
}
