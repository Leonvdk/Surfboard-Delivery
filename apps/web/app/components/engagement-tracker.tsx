"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { isBot } from "../lib/analytics";
import { trackScrollDepth, trackTimeOnPage } from "../lib/analytics";

const SCROLL_THRESHOLDS = [25, 50, 75, 90];
const TIME_MILESTONES = [30, 60, 120, 300];

export function EngagementTracker() {
	const pathname = usePathname();
	const scrollHits = useRef(new Set<number>());
	const timeHits = useRef(new Set<number>());
	// Accumulated *active* (tab-visible) time, in ms.
	const activeMs = useRef(0);
	const lastTick = useRef(Date.now());

	useEffect(() => {
		if (isBot() && window.gtag) {
			window.gtag("set", { traffic_type: "bot" });
		}
	}, []);

	useEffect(() => {
		scrollHits.current.clear();
		timeHits.current.clear();
		activeMs.current = 0;
		lastTick.current = Date.now();

		const handleScroll = () => {
			const scrollTop = window.scrollY;
			const docHeight =
				document.documentElement.scrollHeight - window.innerHeight;
			if (docHeight <= 0) return;
			const percent = Math.round((scrollTop / docHeight) * 100);

			for (const threshold of SCROLL_THRESHOLDS) {
				if (percent >= threshold && !scrollHits.current.has(threshold)) {
					scrollHits.current.add(threshold);
					trackScrollDepth(threshold, pathname);
				}
			}
		};

		// Only count time while the tab is visible, so background tabs don't
		// inflate engagement.
		const handleVisibility = () => {
			if (document.visibilityState === "hidden") {
				activeMs.current += Date.now() - lastTick.current;
			} else {
				lastTick.current = Date.now();
			}
		};

		const interval = setInterval(() => {
			if (document.visibilityState !== "visible") return;
			const now = Date.now();
			activeMs.current += now - lastTick.current;
			lastTick.current = now;
			const elapsed = Math.floor(activeMs.current / 1000);
			for (const milestone of TIME_MILESTONES) {
				if (elapsed >= milestone && !timeHits.current.has(milestone)) {
					timeHits.current.add(milestone);
					trackTimeOnPage(milestone, pathname);
				}
			}
		}, 5000);

		window.addEventListener("scroll", handleScroll, { passive: true });
		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			window.removeEventListener("scroll", handleScroll);
			document.removeEventListener("visibilitychange", handleVisibility);
			clearInterval(interval);
		};
	}, [pathname]);

	return null;
}
