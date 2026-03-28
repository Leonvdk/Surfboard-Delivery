"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	trackNewsletterPopupDismissed,
	trackNewsletterPopupShown,
	trackNewsletterPopupSubmitted,
} from "../lib/analytics";

const SCROLL_THRESHOLD = 0.35;
const MIN_TIME_ON_PAGE_MS = 12_000;
const STORAGE_KEY = "nl_popup_dismissed";
const DISMISS_DAYS = 14;

type Status = "idle" | "submitting" | "success" | "error";

export default function NewsletterPopup() {
	const pathname = usePathname();
	const [visible, setVisible] = useState(false);
	const [closing, setClosing] = useState(false);
	const dismissedRef = useRef(false);
	const timerMetRef = useRef(false);
	const scrollMetRef = useRef(false);
	const shownTracked = useRef(false);

	const [firstName, setFirstName] = useState("");
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [errorMsg, setErrorMsg] = useState("");

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

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!firstName.trim() || !email.trim()) return;

			setStatus("submitting");
			setErrorMsg("");

			try {
				const res = await fetch("/api/newsletter", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						firstName: firstName.trim(),
						email: email.trim(),
					}),
				});

				if (!res.ok) {
					const data = await res.json().catch(() => null);
					throw new Error(data?.error || "Something went wrong");
				}

				setStatus("success");
				trackNewsletterPopupSubmitted(pathname);
				try {
					localStorage.setItem(STORAGE_KEY, String(Date.now()));
				} catch {}
			} catch (err) {
				setStatus("error");
				setErrorMsg(
					err instanceof Error ? err.message : "Something went wrong",
				);
			}
		},
		[firstName, email, pathname],
	);

	if (!visible) return null;

	return (
		<aside
			className={`nl-popup ${closing ? "nl-popup--closing" : ""}`}
			role="complementary"
			aria-label="Newsletter signup"
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

			{status === "success" ? (
				<div className="nl-popup-success">
					<span className="nl-popup-success-icon" aria-hidden="true">
						🤙
					</span>
					<p className="nl-popup-success-title">You&apos;re in the lineup!</p>
					<p className="nl-popup-success-desc">
						Surf tips, local conditions &amp; deals — headed your way.
					</p>
				</div>
			) : (
				<>
					<p className="nl-popup-kicker">Stay in the loop</p>
					<p className="nl-popup-headline">
						Surf conditions, local tips &amp; exclusive deals
					</p>

					<form
						className="nl-popup-form"
						onSubmit={handleSubmit}
						noValidate
					>
						<input
							type="text"
							placeholder="First name"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							required
							className="nl-popup-input"
							autoComplete="given-name"
						/>
						<input
							type="email"
							placeholder="Email address"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="nl-popup-input"
							autoComplete="email"
						/>
						<button
							type="submit"
							className="nl-popup-btn"
							disabled={status === "submitting"}
						>
							{status === "submitting" ? "Joining…" : "Subscribe"}
							{status !== "submitting" && (
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
							)}
						</button>
					</form>

					{status === "error" && (
						<p className="nl-popup-error">{errorMsg}</p>
					)}

					<p className="nl-popup-note">
						No spam — just waves. Unsubscribe anytime.
					</p>
				</>
			)}
		</aside>
	);
}
