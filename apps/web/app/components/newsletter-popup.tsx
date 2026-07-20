"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	trackNewsletterPopupDismissed,
	trackNewsletterPopupShown,
} from "../lib/analytics";

/**
 * Board-match popup. Not a newsletter — we don't run one. This is a
 * secondary conversion prompt that fires when someone has been on the
 * page long enough to be considering a booking. Component name kept as
 * NewsletterPopup so existing analytics events and imports don't break;
 * the tracked events are still useful as "engagement popup" signal.
 */

const SCROLL_THRESHOLD = 0.5;
const MIN_TIME_ON_PAGE_MS = 25_000;
const STORAGE_KEY = "nl_popup_dismissed";
const DISMISS_DAYS = 14;

export default function NewsletterPopup() {
	const pathname = usePathname();
	const [visible, setVisible] = useState(false);
	const [closing, setClosing] = useState(false);
	const dismissedRef = useRef(false);
	const timerMetRef = useRef(false);
	const scrollMetRef = useRef(false);
	const shownTracked = useRef(false);

	const wasPreviouslyDismissed = useCallback(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) return false;
			const ts = Number.parseInt(stored, 10);
			return Date.now() - ts < DISMISS_DAYS * 86_400_000;
		} catch {
			return false;
		}
	}, []);

	const show = useCallback(() => {
		if (dismissedRef.current) return;
		if (!timerMetRef.current || !scrollMetRef.current) return;
		setVisible(true);
		if (!shownTracked.current) {
			trackNewsletterPopupShown(pathname);
			shownTracked.current = true;
		}
	}, [pathname]);

	const dismiss = useCallback(() => {
		trackNewsletterPopupDismissed(pathname);
		setClosing(true);
		try {
			localStorage.setItem(STORAGE_KEY, String(Date.now()));
		} catch {}
		setTimeout(() => {
			setVisible(false);
			setClosing(false);
			dismissedRef.current = true;
		}, 300);
	}, [pathname]);

	useEffect(() => {
		if (wasPreviouslyDismissed()) {
			dismissedRef.current = true;
			return;
		}

		const timer = setTimeout(() => {
			timerMetRef.current = true;
			show();
		}, MIN_TIME_ON_PAGE_MS);

		function onScroll() {
			const scrolled =
				window.scrollY /
				(document.documentElement.scrollHeight - window.innerHeight);
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
	}, [show, wasPreviouslyDismissed]);

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
			className={`nl-popup ${closing ? "nl-popup--closing" : ""}`}
			role="complementary"
			aria-label="Find your board"
		>
			<button
				className="nl-popup-close"
				onClick={dismiss}
				aria-label="Dismiss"
				type="button"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>

			<p className="nl-popup-kicker">Still deciding?</p>
			<p className="nl-popup-headline">
				Find <em>your</em> board in 30&nbsp;seconds.
			</p>
			<p className="nl-popup-note">
				Tell us your level, height, and dates. We&apos;ll match you to the
				right board — free delivery, wrong-fit swap on day two.
			</p>

			<div className="nl-popup-actions">
				<Link
					href="/contact"
					className="nl-popup-btn"
					onClick={dismiss}
				>
					Match my board
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="5" y1="12" x2="19" y2="12" />
						<polyline points="12 5 19 12 12 19" />
					</svg>
				</Link>
				<Link
					href="/surf-gear"
					className="nl-popup-btn-secondary"
					onClick={dismiss}
				>
					See all boards
				</Link>
			</div>
		</aside>
	);
}
