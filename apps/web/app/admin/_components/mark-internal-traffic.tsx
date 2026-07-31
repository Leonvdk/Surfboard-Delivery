"use client";

import { useEffect } from "react";
import { markInternalTraffic } from "../../lib/analytics";

/**
 * Rendered inside the admin layout. Reaching /admin means it's the owner, so
 * we flag this browser as internal traffic — from then on GA4 events carry
 * traffic_type:"internal" and the built-in Internal Traffic data filter keeps
 * the owner's own visits (phone, laptop, home Wi-Fi) out of the reports.
 */
export function MarkInternalTraffic() {
	useEffect(() => {
		markInternalTraffic();
	}, []);
	return null;
}
