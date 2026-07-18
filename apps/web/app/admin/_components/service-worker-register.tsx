"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
	useEffect(() => {
		if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
			return;
		}
		if (process.env.NODE_ENV === "development") {
			// Skip in dev — Next.js dev already reloads aggressively and a live
			// SW would just get in the way. Register in production only.
			return;
		}
		const controller = new AbortController();
		navigator.serviceWorker
			.register("/admin/sw.js", { scope: "/admin/" })
			.catch((err) => {
				console.warn("[admin] SW registration failed:", err);
			});
		return () => controller.abort();
	}, []);
	return null;
}
