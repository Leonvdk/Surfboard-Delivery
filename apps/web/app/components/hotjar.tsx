"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { isInternalTraffic } from "../lib/analytics";

/**
 * Hotjar behaviour analytics (heatmaps, session recordings, funnels) — used to
 * see how visitors move through the booking journey and where they drop off.
 * Rendered only inside SiteAnalytics, so like GA it never loads on /admin.
 *
 * Owner exclusion: any browser that has ever opened /admin carries the
 * sra_internal flag (see markInternalTraffic in lib/analytics). GA tags those
 * events as internal and filters them; here we go one further and never inject
 * Hotjar at all — the owner's own browsing shouldn't eat recording quota.
 * The check runs in an effect so the decision is made client-side, after the
 * flag is readable, without a hydration mismatch.
 */
export function Hotjar() {
	const [enabled, setEnabled] = useState(false);

	useEffect(() => {
		if (!isInternalTraffic()) setEnabled(true);
	}, []);

	if (!enabled) return null;

	return (
		<Script id="hotjar" strategy="afterInteractive">
			{`(function(h,o,t,j,a,r){
				h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
				h._hjSettings={hjid:6763032,hjsv:6};
				a=o.getElementsByTagName('head')[0];
				r=o.createElement('script');r.async=1;
				r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
				a.appendChild(r);
			})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
		</Script>
	);
}
