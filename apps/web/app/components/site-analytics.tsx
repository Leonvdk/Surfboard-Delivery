"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from "next/navigation";
import { ConsentNotice } from "./consent-notice";
import { EngagementTracker } from "./engagement-tracker";
import { Hotjar } from "./hotjar";
import { OutboundTracker } from "./outbound-tracker";

/**
 * Analytics for the public site only. These used to sit directly in the
 * root layout, which meant every admin page view — customer names,
 * booking ids in the URL, Leon's own daily usage — was being sent to
 * Google Analytics and Vercel. The admin panel is private, so it gets
 * no tracking at all: returning null here means the GA script is never
 * injected on those routes, not merely that events are filtered later.
 */
export function SiteAnalytics({ gaId }: { gaId: string }) {
	const pathname = usePathname();
	if (pathname?.startsWith("/admin")) return null;

	return (
		<>
			<GoogleAnalytics gaId={gaId} />
			<Analytics />
			<SpeedInsights />
			<Hotjar />
			{/* Scroll-depth and outbound-click tracking — public site only,
				for the same reason. */}
			<EngagementTracker />
			<OutboundTracker />
			<ConsentNotice />
		</>
	);
}
