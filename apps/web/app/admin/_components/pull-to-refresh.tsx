"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const TRIGGER_DISTANCE = 80;

/**
 * Native-feeling pull-to-refresh gesture for the admin PWA. Only arms
 * when the page is already scrolled to the top, so it doesn't interfere
 * with normal vertical scroll of long lists. Runs router.refresh() on
 * release past the threshold — server components re-render with fresh
 * data without a full navigation.
 */
export function PullToRefresh() {
	const router = useRouter();
	const [distance, setDistance] = useState(0);
	const [refreshing, setRefreshing] = useState(false);
	const startY = useRef<number | null>(null);
	const armed = useRef(false);

	useEffect(() => {
		function onTouchStart(e: TouchEvent) {
			if (window.scrollY > 2) {
				armed.current = false;
				startY.current = null;
				return;
			}
			armed.current = true;
			startY.current = e.touches[0]?.clientY ?? null;
		}
		function onTouchMove(e: TouchEvent) {
			if (!armed.current || startY.current == null) return;
			const y = e.touches[0]?.clientY ?? 0;
			const dy = y - startY.current;
			if (dy <= 0) {
				setDistance(0);
				return;
			}
			// Rubber-band the pull so it feels resistant near the threshold.
			const eased = Math.min(TRIGGER_DISTANCE * 1.5, dy * 0.55);
			setDistance(eased);
		}
		function onTouchEnd() {
			if (!armed.current) return;
			armed.current = false;
			startY.current = null;
			if (distance >= TRIGGER_DISTANCE && !refreshing) {
				setRefreshing(true);
				setDistance(TRIGGER_DISTANCE);
				router.refresh();
				// Give the refresh a moment so the indicator doesn't snap back
				// while the server components are still coming in.
				window.setTimeout(() => {
					setRefreshing(false);
					setDistance(0);
				}, 900);
			} else {
				setDistance(0);
			}
		}

		document.addEventListener("touchstart", onTouchStart, { passive: true });
		document.addEventListener("touchmove", onTouchMove, { passive: true });
		document.addEventListener("touchend", onTouchEnd);
		document.addEventListener("touchcancel", onTouchEnd);

		return () => {
			document.removeEventListener("touchstart", onTouchStart);
			document.removeEventListener("touchmove", onTouchMove);
			document.removeEventListener("touchend", onTouchEnd);
			document.removeEventListener("touchcancel", onTouchEnd);
		};
	}, [distance, refreshing, router]);

	const progress = Math.min(1, distance / TRIGGER_DISTANCE);
	const armedForRefresh = progress >= 1;

	return (
		<div
			className="ptr"
			aria-hidden="true"
			style={{
				transform: `translateY(${distance - 44}px)`,
				opacity: progress,
			}}
		>
			<div
				className={`ptr-badge${armedForRefresh || refreshing ? " ptr-badge--armed" : ""}${refreshing ? " ptr-badge--spinning" : ""}`}
				style={{
					transform: `rotate(${progress * 360}deg)`,
				}}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 20 20"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M4 10a6 6 0 1 1 2 4.472" />
					<path d="M4 15v-4h4" />
				</svg>
			</div>
		</div>
	);
}
