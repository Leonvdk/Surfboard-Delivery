"use client";

import { useState } from "react";
import { CheckIcon, ExternalIcon } from "./icons";

/**
 * One-click subscribe to the delivery/pickup feed.
 *
 * Google's "add by URL" flow is a plain link — calendar.google.com/calendar/r
 * with the feed as `cid`. Passing it as webcal:// is what makes Google treat
 * it as a *subscription* (re-polled forever) rather than a one-off import
 * (a frozen snapshot that never updates). Same webcal:// URL drives Apple
 * Calendar and every other desktop client, so the second button is just the
 * raw scheme.
 *
 * Google Calendar does not read colour from a feed — each subscriber picks
 * it in their own UI — so the brand hex is offered as copyable text rather
 * than pretending the feed can set it.
 */

interface Props {
	feedUrl: string;
	brandColor: string;
}

function CopyButton({ value, label }: { value: string; label: string }) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			// Clipboard API needs a secure context and can be blocked; the
			// value is on screen and selectable either way, so a failed copy
			// shouldn't look like a crash.
			return;
		}
		setCopied(true);
		window.setTimeout(() => setCopied(false), 2000);
	}

	return (
		<button type="button" className="admin-btn" onClick={copy}>
			{copied ? (
				<>
					<CheckIcon /> Copied
				</>
			) : (
				label
			)}
		</button>
	);
}

export function CalendarSubscribe({ feedUrl, brandColor }: Props) {
	const webcal = feedUrl.replace(/^https?:/, "webcal:");
	const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;

	return (
		<div className="admin-subscribe">
			<div className="admin-subscribe-actions">
				<a
					href={googleUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="admin-btn admin-btn--primary"
				>
					Add to Google Calendar <ExternalIcon />
				</a>
				<a href={webcal} className="admin-btn">
					Apple Calendar
				</a>
				<CopyButton value={feedUrl} label="Copy feed URL" />
			</div>

			<p className="admin-card-hint">
				Sign in as hello@surfrental-aljezur.com first — Google adds the
				calendar to whichever account is active. Every delivery and
				collection then appears automatically and follows your edits. Google
				re-checks subscribed feeds on its own schedule, so a brand-new
				booking can take a few hours to show up.
			</p>

			<div className="admin-subscribe-color">
				<span
					className="admin-subscribe-swatch"
					style={{ background: brandColor }}
					aria-hidden="true"
				/>
				<div>
					<strong>Set the colour to {brandColor}</strong>
					<p className="admin-card-hint">
						Google ignores colour from a feed. In the sidebar, hover the
						calendar → three dots → the <strong>+</strong> in the colour
						grid → paste the hex. Apple Calendar picks it up on its own.
					</p>
				</div>
				<CopyButton value={brandColor} label="Copy hex" />
			</div>

			<details className="admin-subscribe-details">
				<summary>Feed URL</summary>
				<code className="admin-feed-url">{feedUrl}</code>
				<p className="admin-card-hint">
					Treat this like a password — it exposes customer names, addresses
					and phone numbers. Rotate it by changing CALENDAR_FEED_TOKEN in
					Vercel, then re-subscribing.
				</p>
			</details>
		</div>
	);
}
