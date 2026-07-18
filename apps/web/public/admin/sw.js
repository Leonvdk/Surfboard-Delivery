// Minimal service worker for the Surf Rental Admin PWA.
// Presence of a fetch handler is what makes the app installable on desktop
// Chrome and other Chromium engines — the network-first strategy just proxies
// to the actual server so booking data is always fresh. If Leon is offline the
// browser's own error page shows, which is fine for now (offline mode isn't
// a real requirement for an admin dashboard).

const CACHE_NAME = "sra-admin-v1";

self.addEventListener("install", (event) => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(
				keys
					.filter((k) => k.startsWith("sra-admin-") && k !== CACHE_NAME)
					.map((k) => caches.delete(k)),
			);
			await self.clients.claim();
		})(),
	);
});

self.addEventListener("fetch", (event) => {
	// Only handle same-origin GETs — anything else falls through to the network.
	const req = event.request;
	if (req.method !== "GET") return;
	const url = new URL(req.url);
	if (url.origin !== self.location.origin) return;

	// Network-first: try live, fall back to cache if offline. Only cache the
	// static shell (icons, manifest) — booking pages must always be fresh.
	const isShell =
		url.pathname === "/admin/manifest.webmanifest" ||
		url.pathname === "/admin/icon" ||
		url.pathname === "/admin/icon-512" ||
		url.pathname === "/admin/apple-icon";

	event.respondWith(
		(async () => {
			try {
				const fresh = await fetch(req);
				if (isShell && fresh.ok) {
					const cache = await caches.open(CACHE_NAME);
					cache.put(req, fresh.clone());
				}
				return fresh;
			} catch (err) {
				if (isShell) {
					const cached = await caches.match(req);
					if (cached) return cached;
				}
				throw err;
			}
		})(),
	);
});
