"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "blog-cta-dismissed";
const SCROLL_THRESHOLD = 0.4;
const MIN_TIME_ON_PAGE_MS = 15_000;

export default function BlogCtaPopup() {
	const [visible, setVisible] = useState(false);
	const [closing, setClosing] = useState(false);
	const dismissedRef = useRef(false);
	const timerMetRef = useRef(false);
	const scrollMetRef = useRef(false);

	const show = useCallback(() => {
		if (dismissedRef.current) return;
		if (!timerMetRef.current || !scrollMetRef.current) return;
		setVisible(true);
	}, []);

	const dismiss = useCallback(() => {
		setClosing(true);
		setTimeout(() => {
			setVisible(false);
			setClosing(false);
			dismissedRef.current = true;
			try {
				sessionStorage.setItem(STORAGE_KEY, "1");
			} catch {}
		}, 300);
	}, []);

	useEffect(() => {
		try {
			if (sessionStorage.getItem(STORAGE_KEY) === "1") {
				dismissedRef.current = true;
				return;
			}
		} catch {}

		const timer = setTimeout(() => {
			timerMetRef.current = true;
			show();
		}, MIN_TIME_ON_PAGE_MS);

		function onScroll() {
			const scrolled =
				window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
			if (scrolled >= SCROLL_THRESHOLD) {
				scrollMetRef.current = true;
				show();
			}
		}

		window.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			clearTimeout(timer);
			window.removeEventListener("scroll", onScroll);
		};
	}, [show]);

	useEffect(() => {
		if (!visible) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") dismiss();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [visible, dismiss]);

	if (!visible) return null;

	return (
		<aside
			className={`blog-popup ${closing ? "blog-popup--closing" : ""}`}
			role="complementary"
			aria-label="Booking prompt"
		>
			<button
				className="blog-popup-close"
				onClick={dismiss}
				aria-label="Dismiss"
				type="button"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>

			<p className="blog-popup-kicker">Planning a surf trip?</p>
			<p className="blog-popup-headline">
				Get boards &amp; wetsuits delivered to your door in Aljezur
			</p>

			<Link href="/contact" className="blog-popup-cta" onClick={dismiss}>
				Check availability
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
					<line x1="5" y1="12" x2="19" y2="12" />
					<polyline points="12 5 19 12 12 19" />
				</svg>
			</Link>

			<p className="blog-popup-note">Free delivery &middot; Flexible cancellation</p>
		</aside>
	);
}
