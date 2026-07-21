"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Owner-vouches card. Full-height cutout of Leon on one side, quote
 * + name + rating on the other. Designed for a transparent-background
 * PNG at /images/leon-cutout.png — the figure stands at the bottom of
 * the photo slot so it reads like a real person standing next to the
 * copy. Falls back to an "L" monogram until the cutout is published.
 *
 * The card lives directly under the submit button on /contact — the
 * moment the customer just decided to send the request, they meet
 * the person on the other end.
 */
export function OwnerVouch() {
	const [failed, setFailed] = useState(false);

	return (
		<aside className="owner-vouch" aria-label="Meet the owner">
			<div className="owner-vouch-photo">
				{failed ? (
					<span className="owner-vouch-mono" aria-hidden="true">
						L
					</span>
				) : (
					<Image
						src="/images/leon-cutout.png"
						alt="Leon van de Klundert — owner of Surf Rental Aljezur"
						fill
						sizes="(max-width: 640px) 40vw, 200px"
						onError={() => setFailed(true)}
						unoptimized
					/>
				)}
			</div>
			<div className="owner-vouch-body">
				<p className="owner-vouch-name">
					Leon van de Klundert · owner
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
	);
}
