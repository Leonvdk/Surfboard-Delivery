"use client";

import { useEffect, useState } from "react";

const STORE = "sra_consent";
const SEEN = "sra_consent_notice_seen";

/**
 * Implied-consent notice + Google Consent Mode signal. Consent Mode defaults
 * to analytics_storage:'denied' (set in the root layout before GA loads);
 * staying on the site grants it. The notice is a small bottom-left pill that
 * shows once per browsing session and auto-dismisses after a few seconds.
 * Ad storage stays denied — we run no ads.
 */
export function ConsentNotice() {
	const [visible, setVisible] = useState(false);
	const [leaving, setLeaving] = useState(false);

	useEffect(() => {
		// Staying on the site = consent. Grant analytics storage every load so
		// returning visitors are tracked without re-prompting.
		try {
			window.gtag?.("consent", "update", { analytics_storage: "granted" });
			localStorage.setItem(STORE, "granted");
		} catch {
			/* storage blocked — consent still granted for this pageview */
		}

		// Show the notice once per session, then let it fade out.
		let seen = false;
		try {
			seen = sessionStorage.getItem(SEEN) === "1";
		} catch {
			/* ignore */
		}
		if (seen) return;
		try {
			sessionStorage.setItem(SEEN, "1");
		} catch {
			/* ignore */
		}
		setVisible(true);
		const fade = setTimeout(() => setLeaving(true), 6000);
		const hide = setTimeout(() => setVisible(false), 6400);
		return () => {
			clearTimeout(fade);
			clearTimeout(hide);
		};
	}, []);

	if (!visible) return null;

	const dismiss = () => {
		setLeaving(true);
		setTimeout(() => setVisible(false), 400);
	};

	return (
		<div
			className={`consent-notice${leaving ? " consent-notice--leaving" : ""}`}
			role="status"
			aria-live="polite"
		>
			<p className="consent-notice-text">
				By staying on this site, you consent to analytics cookies that help us
				make it better.{" "}
				<a href="/privacy" className="consent-notice-link">
					Privacy
				</a>
			</p>
			<button
				type="button"
				className="consent-notice-close"
				onClick={dismiss}
				aria-label="Dismiss notice"
			>
				×
			</button>
		</div>
	);
}
