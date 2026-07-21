"use client";

import { useState } from "react";

/**
 * Owner-vouches card. Full-height cutout of Leon anchored to the
 * bottom-left of the card and bleeding ~40% of its own width out
 * past the card's left edge. Puts a real person on the page directly
 * under the "Send request" button — the moment the customer just
 * decided to trust the flow.
 *
 * Cutout lives at /images/leon-cutout.webp (transparent alpha).
 * If the file is missing an "L" monogram fills the photo column so
 * the card doesn't render broken.
 */
export function OwnerVouch() {
	const [failed, setFailed] = useState(false);

	// Wrapper carries the card's own hard box-shadow. The inner card
	// carries the clip-path that lets the cutout bleed sideways but
	// clamps its bottom so Leon's silhouette-shadow can't drip past
	// the card floor.
	return (
		<div className="owner-vouch-frame">
			<aside className="owner-vouch" aria-label="Meet the owner">
				<div className="owner-vouch-photo">
					{failed ? (
						<span className="owner-vouch-mono" aria-hidden="true">
							L
						</span>
					) : (
						// Plain <img> (not next/image) so the CSS transform can
						// bleed the cutout out past the card edge cleanly. The
						// file is ~85KB so responsive srcsets aren't needed here.
						<img
							src="/images/leon-cutout.webp"
							alt="Léon — owner of Surf Rental Aljezur"
							className="owner-vouch-cutout"
							onError={() => setFailed(true)}
						/>
					)}
				</div>
				<div className="owner-vouch-body">
					<p className="owner-vouch-name">
						Léon · Owner · Surfer
					</p>
					<p className="owner-vouch-quote">
						“I read every request personally and reply from my phone —
						usually within a few hours. You&apos;ll only pay after I
						confirm gear and dates.”
					</p>
					<p className="owner-vouch-meta">
						4.9★ across 8 reviews · Aljezur since Sept 2025 · replies in
						EN · NL · DE · FR · PT
					</p>
				</div>
			</aside>
		</div>
	);
}
