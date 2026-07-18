"use client";

import { useEffect, useState } from "react";

type State =
	| "unsupported"
	| "denied"
	| "loading"
	| "subscribed"
	| "unsubscribed"
	| "error";

function urlBase64ToUint8Array(base64: string): Uint8Array {
	const padding = "=".repeat((4 - (base64.length % 4)) % 4);
	const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(b64);
	const arr = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
	return arr;
}

export function NotificationsToggle() {
	const [state, setState] = useState<State>("loading");
	const [message, setMessage] = useState<string>("");

	useEffect(() => {
		void (async () => {
			if (
				typeof navigator === "undefined" ||
				!("serviceWorker" in navigator) ||
				!("PushManager" in window) ||
				!("Notification" in window)
			) {
				setState("unsupported");
				return;
			}
			if (Notification.permission === "denied") {
				setState("denied");
				return;
			}
			try {
				const reg = await navigator.serviceWorker.ready;
				const sub = await reg.pushManager.getSubscription();
				setState(sub ? "subscribed" : "unsubscribed");
			} catch {
				setState("error");
			}
		})();
	}, []);

	async function subscribe() {
		setState("loading");
		setMessage("");
		try {
			const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
			if (!publicKey) {
				setState("error");
				setMessage("Missing VAPID public key");
				return;
			}
			const perm = await Notification.requestPermission();
			if (perm !== "granted") {
				setState(perm === "denied" ? "denied" : "unsubscribed");
				return;
			}
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
			});
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
				setState("error");
				setMessage(`Server rejected subscription (${res.status})`);
				return;
			}
			setState("subscribed");
		} catch (err) {
			setState("error");
			setMessage(err instanceof Error ? err.message : "unknown error");
		}
	}

	async function unsubscribe() {
		setState("loading");
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
			setState("unsubscribed");
		} catch (err) {
			setState("error");
			setMessage(err instanceof Error ? err.message : "unknown error");
		}
	}

	if (state === "unsupported") {
		return (
			<p className="notif-toggle notif-toggle--hint">
				Push isn&apos;t supported in this browser. Install the admin PWA to
				your iPhone home screen for notifications.
			</p>
		);
	}
	if (state === "denied") {
		return (
			<p className="notif-toggle notif-toggle--hint">
				Notifications are blocked at the OS level. Enable them in
				Settings → Notifications → SR Admin.
			</p>
		);
	}

	return (
		<div className="notif-toggle">
			{state === "subscribed" ? (
				<button
					type="button"
					className="admin-btn"
					onClick={unsubscribe}
				>
					Turn off push notifications
				</button>
			) : (
				<button
					type="button"
					className="admin-btn admin-btn--primary"
					onClick={subscribe}
					disabled={state === "loading"}
				>
					{state === "loading" ? "…" : "Enable push notifications"}
				</button>
			)}
			{message && <p className="notif-toggle-error">{message}</p>}
		</div>
	);
}
