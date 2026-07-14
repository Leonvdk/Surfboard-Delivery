"use client";

import { useEffect, useRef } from "react";
import { trackBlogPostRead } from "../lib/analytics";

/**
 * Fires a single `blog_post_read` event when the reader leaves the post,
 * capturing how far they scrolled and how long they actively spent. Mounted
 * on the blog post page so we can see which articles are actually read
 * (vs. bounced) and whether that correlates with conversions.
 */
export function BlogReadTracker({
	slug,
	readingTime,
}: {
	slug: string;
	readingTime: number;
}) {
	const maxScroll = useRef(0);
	const activeMs = useRef(0);
	const lastTick = useRef(Date.now());
	const sent = useRef(false);

	useEffect(() => {
		maxScroll.current = 0;
		activeMs.current = 0;
		lastTick.current = Date.now();
		sent.current = false;

		const onScroll = () => {
			const docHeight =
				document.documentElement.scrollHeight - window.innerHeight;
			if (docHeight <= 0) return;
			const percent = Math.round((window.scrollY / docHeight) * 100);
			if (percent > maxScroll.current) maxScroll.current = Math.min(percent, 100);
		};

		const accrue = () => {
			activeMs.current += Date.now() - lastTick.current;
			lastTick.current = Date.now();
		};

		const report = () => {
			if (sent.current) return;
			sent.current = true;
			accrue();
			trackBlogPostRead({
				post_slug: slug,
				reading_time: readingTime,
				scroll_depth: maxScroll.current,
				time_spent: Math.floor(activeMs.current / 1000),
			});
		};

		const onVisibility = () => {
			if (document.visibilityState === "hidden") {
				accrue();
				report();
			} else {
				lastTick.current = Date.now();
			}
		};

		window.addEventListener("scroll", onScroll, { passive: true });
		document.addEventListener("visibilitychange", onVisibility);
		window.addEventListener("pagehide", report);

		return () => {
			window.removeEventListener("scroll", onScroll);
			document.removeEventListener("visibilitychange", onVisibility);
			window.removeEventListener("pagehide", report);
			// Fire on client-side navigation away from the post.
			report();
		};
	}, [slug, readingTime]);

	return null;
}
