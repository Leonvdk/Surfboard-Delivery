// Service worker for the Surf Rental Admin PWA.
//
// Responsibilities:
//   1. Provide the fetch handler that makes the app installable on Chrome
//      (network-first for the shell assets; everything else passes through).
//   2. Handle web-push events and show a native notification.
//   3. On notification tap, focus an existing tab if we have one already
//      on that URL — otherwise open a new one.
//   4. Increment/clear the app badge (unread count) so Leon sees a
//      numbered dot on the home-screen icon.
//
// Version the cache name whenever the shell asset list changes so old
// SWs get evicted on the next activate.

const CACHE_NAME = "sra-admin-v3";
const SHELL_PATHS = new Set([
	"/admin/manifest.webmanifest",
	"/admin/icon",
	"/admin/icon-512",
	"/admin/apple-icon",
]);

self.addEventListener("install", () => {
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
	const req = event.request;
	if (req.method !== "GET") return;
	const url = new URL(req.url);
	if (url.origin !== self.location.origin) return;

	const isShell = SHELL_PATHS.has(url.pathname);

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

// ─── Push handling ──────────────────────────────────────

self.addEventListener("push", (event) => {
	let payload = {};
	if (event.data) {
		try {
			payload = event.data.json();
		} catch {
			payload = {
				title: "Surf Rental Admin",
				body: event.data.text(),
				url: "/admin",
			};
		}
	}

	const title = payload.title || "Surf Rental Admin";
	const body = payload.body || "";
	const url = payload.url || "/admin";
	const tag = payload.tag || url;
	const badgeCount = typeof payload.badge === "number" ? payload.badge : null;

	event.waitUntil(
		Promise.all([
			self.registration.showNotification(title, {
				body,
				tag,
				renotify: true,
				icon: "/admin/icon",
				badge: "/admin/icon",
				data: { url },
			}),
			badgeCount != null && "setAppBadge" in self.navigator
				? self.navigator.setAppBadge(badgeCount).catch(() => {})
				: Promise.resolve(),
		]),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const targetPath = event.notification.data?.url || "/admin";

	event.waitUntil(
		(async () => {
			const allClients = await self.clients.matchAll({
				type: "window",
				includeUncontrolled: true,
			});
			// If any tab already shows the admin surface, focus it and navigate.
			for (const client of allClients) {
				const u = new URL(client.url);
				if (u.pathname.startsWith("/admin")) {
					await client.focus();
					if ("navigate" in client) {
						try {
							await client.navigate(targetPath);
						} catch {
							// Cross-origin or state-locked; ignore and rely on focus.
						}
					}
					return;
				}
			}
			// Nothing open — spawn a new tab.
			await self.clients.openWindow(targetPath);
		})(),
	);
});
