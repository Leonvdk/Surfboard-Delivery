"use client";

import { useEffect } from "react";

interface Props {
	count: number;
}

// Keeps the OS app-icon badge in sync with the server-computed count.
// Runs on every admin page render so a stale badge auto-clears when Leon
// visits the app. Silently no-ops if the browser doesn't support the API.
export function BadgeUpdater({ count }: Props) {
	useEffect(() => {
		if (typeof navigator === "undefined") return;
		const nav = navigator as Navigator & {
			setAppBadge?: (n?: number) => Promise<void>;
			clearAppBadge?: () => Promise<void>;
		};
		if (count > 0 && nav.setAppBadge) {
			nav.setAppBadge(count).catch(() => {});
		} else if (nav.clearAppBadge) {
			nav.clearAppBadge().catch(() => {});
		}
	}, [count]);
	return null;
}
