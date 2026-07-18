"use client";

import { useCallback, useEffect, useState } from "react";

interface Diag {
	standalone: boolean;
	swSupported: boolean;
	swActive: boolean;
	pushSupported: boolean;
	permission: NotificationPermission | "unavailable";
	locallySubscribed: boolean;
	serverCount: number | null;
	vapidLen: number;
}

const initialDiag: Diag = {
	standalone: false,
	swSupported: false,
	swActive: false,
	pushSupported: false,
	permission: "unavailable",
	locallySubscribed: false,
	serverCount: null,
	vapidLen: 0,
};

function urlBase64ToUint8Array(base64: string): Uint8Array {
	const padding = "=".repeat((4 - (base64.length % 4)) % 4);
	const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(b64);
	const arr = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
	return arr;
}

export function NotificationsToggle() {
	const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
	const [diag, setDiag] = useState<Diag>({ ...initialDiag, vapidLen: publicKey.length });
	const [busy, setBusy] = useState<"idle" | "subscribe" | "unsubscribe" | "test">(
		"idle",
	);
	const [message, setMessage] = useState<string>("");

	const refresh = useCallback(async () => {
		const next: Diag = { ...initialDiag, vapidLen: publicKey.length };
		if (typeof window === "undefined") return;

		next.standalone =
			window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
			// Safari's non-standard nav flag for home-screen apps
			(navigator as { standalone?: boolean }).standalone === true;

		next.swSupported = "serviceWorker" in navigator;
		next.pushSupported = "PushManager" in window;
		next.permission =
			"Notification" in window ? Notification.permission : "unavailable";

		if (next.swSupported) {
			try {
				const reg = await navigator.serviceWorker.getRegistration("/admin/");
				next.swActive = !!reg?.active;
				if (reg && next.pushSupported) {
					const sub = await reg.pushManager.getSubscription();
					next.locallySubscribed = !!sub;
				}
			} catch {
				// leave defaults
			}
		}

		try {
			const res = await fetch("/api/admin/push/status");
			if (res.ok) {
				const data = (await res.json()) as { count: number };
				next.serverCount = data.count;
			}
		} catch {
			// ignore
		}

		setDiag(next);
	}, [publicKey.length]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	async function subscribe() {
		setBusy("subscribe");
		setMessage("");
		try {
			if (!publicKey) {
				setMessage("NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing in the client bundle.");
				return;
			}
			if (!("Notification" in window)) {
				setMessage("Notification API isn't available in this browser.");
				return;
			}
			if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
				setMessage("Service Worker or PushManager missing.");
				return;
			}

			// Ask for permission from inside the click handler. Await resolves
			// on all modern engines (Safari 16.4+, Chrome, Firefox).
			const perm = await Notification.requestPermission();
			if (perm !== "granted") {
				setMessage(`Permission is "${perm}" — allow it and try again.`);
				await refresh();
				return;
			}

			const reg = await navigator.serviceWorker.ready;

			// Reuse any existing subscription — subscribing a second time on the
			// same registration throws InvalidStateError on Safari.
			let sub = await reg.pushManager.getSubscription();
			if (!sub) {
				sub = await reg.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
				});
			}

			const res = await fetch("/api/admin/push/subscribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					endpoint: sub.endpoint,
					keys: sub.toJSON().keys,
					userAgent: navigator.userAgent,
				}),
			});
			if (!res.ok) {
				const txt = await res.text().catch(() => "");
				setMessage(`Server rejected subscription (HTTP ${res.status}): ${txt.slice(0, 200)}`);
				return;
			}
			setMessage("Subscribed. Try the test push below.");
		} catch (err) {
			setMessage(
				`Subscribe failed: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`,
			);
		} finally {
			setBusy("idle");
			await refresh();
		}
	}

	async function unsubscribe() {
		setBusy("unsubscribe");
		setMessage("");
		try {
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.getSubscription();
			if (sub) {
				await fetch("/api/admin/push/unsubscribe", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ endpoint: sub.endpoint }),
				}).catch(() => {});
				await sub.unsubscribe();
			}
			setMessage("Unsubscribed on this device.");
		} catch (err) {
			setMessage(err instanceof Error ? err.message : "unknown error");
		} finally {
			setBusy("idle");
			await refresh();
		}
	}

	async function sendTest() {
		setBusy("test");
		setMessage("");
		try {
			const res = await fetch("/api/admin/push/test", { method: "POST" });
			const data = (await res.json().catch(() => ({}))) as {
				sent?: number;
				pruned?: number;
				error?: string;
			};
			if (!res.ok) {
				setMessage(`Test send failed (HTTP ${res.status}): ${data.error ?? ""}`);
			} else {
				setMessage(
					`Test push dispatched to ${data.sent ?? 0} subscription(s). ${
						data.pruned ? `Pruned ${data.pruned} dead. ` : ""
					}Check your home screen.`,
				);
			}
		} catch (err) {
			setMessage(err instanceof Error ? err.message : "unknown error");
		} finally {
			setBusy("idle");
			await refresh();
		}
	}

	const canSubscribe =
		diag.swSupported &&
		diag.pushSupported &&
		diag.permission !== "denied" &&
		diag.vapidLen > 0;

	return (
		<details className="notif-toggle">
			<summary className="notif-toggle-summary">
				Push notifications
				{diag.serverCount != null && (
					<span className="notif-toggle-badge">{diag.serverCount}</span>
				)}
			</summary>

			<dl className="notif-diag">
				<dt>Standalone (installed PWA)</dt>
				<dd>{diag.standalone ? "yes" : "no — add to home screen first"}</dd>
				<dt>Service Worker</dt>
				<dd>
					{diag.swSupported
						? diag.swActive
							? "active"
							: "registered but not active"
						: "not supported"}
				</dd>
				<dt>PushManager</dt>
				<dd>{diag.pushSupported ? "supported" : "not supported"}</dd>
				<dt>Permission</dt>
				<dd>{diag.permission}</dd>
				<dt>Subscription (this device)</dt>
				<dd>{diag.locallySubscribed ? "yes" : "no"}</dd>
				<dt>Subscriptions (server)</dt>
				<dd>{diag.serverCount ?? "?"}</dd>
				<dt>VAPID key in bundle</dt>
				<dd>{diag.vapidLen > 0 ? `yes (${diag.vapidLen} chars)` : "MISSING"}</dd>
			</dl>

			<div className="notif-actions">
				{diag.locallySubscribed ? (
					<>
						<button
							type="button"
							className="admin-btn"
							onClick={sendTest}
							disabled={busy !== "idle"}
						>
							{busy === "test" ? "Sending…" : "Send test push"}
						</button>
						<button
							type="button"
							className="admin-btn"
							onClick={unsubscribe}
							disabled={busy !== "idle"}
						>
							{busy === "unsubscribe" ? "…" : "Turn off"}
						</button>
					</>
				) : (
					<button
						type="button"
						className="admin-btn admin-btn--primary"
						onClick={subscribe}
						disabled={busy !== "idle" || !canSubscribe}
					>
						{busy === "subscribe"
							? "Requesting…"
							: canSubscribe
								? "Enable push notifications"
								: "Unavailable (see status above)"}
					</button>
				)}
			</div>

			{message && <p className="notif-toggle-msg">{message}</p>}
		</details>
	);
}
