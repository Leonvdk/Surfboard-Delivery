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
	const startTime = useRef(Date.now());

	useEffect(() => {
		if (isBot() && window.gtag) {
			window.gtag("set", { traffic_type: "bot" });
		}
	}, []);

	useEffect(() => {
		scrollHits.current.clear();
		timeHits.current.clear();
		startTime.current = Date.now();

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

		const interval = setInterval(() => {
			const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
			for (const milestone of TIME_MILESTONES) {
				if (elapsed >= milestone && !timeHits.current.has(milestone)) {
					timeHits.current.add(milestone);
					trackTimeOnPage(milestone, pathname);
				}
			}
		}, 5000);

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", handleScroll);
			clearInterval(interval);
		};
	}, [pathname]);

	return null;
}
