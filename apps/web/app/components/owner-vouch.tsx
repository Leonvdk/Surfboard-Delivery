"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Owner-vouches strip. Sits directly above the booking form so the
 * customer sees a human (Leon) before they type anything. Puts a face
 * on the "we reply within 3 hours" promise so the flow doesn't feel
 * like a lead-capture funnel — closes the "too good to be true"
 * moment Swiss customers described on 2026-07-21.
 *
 * Photo lives at /images/leon.jpg. If the file is missing or fails
 * to load, we fall back to a big "L" monogram so the layout still
 * reads intentional. Swap in a real portrait when Leon has one; no
 * code changes required.
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
						src="/images/leon.jpg"
						alt="Leon van de Klundert — owner of Surf Rental Aljezur"
						width={72}
						height={72}
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
					“I read every request personally and usually reply within a few
					hours. You&apos;ll pay only after I confirm gear and dates —
					never before.”
				</p>
				<p className="owner-vouch-meta">
					4.9★ across 8 reviews · reply in EN · NL · DE · FR · PT
				</p>
			</div>
		</aside>
	);
}
