"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

const BellIcon = ({ silent }: { silent: boolean }) => (
	<svg
		width={20}
		height={20}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.8}
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M6 8a6 6 0 0 1 12 0v5l1.5 3h-15L6 13Z" />
		<path d="M10 19a2 2 0 0 0 4 0" />
		{silent && <path d="M4 4l16 16" />}
	</svg>
);

export function NotificationsBell() {
	const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
	const [diag, setDiag] = useState<Diag>({
		...initialDiag,
		vapidLen: publicKey.length,
	});
	const [busy, setBusy] = useState<
		"idle" | "subscribe" | "unsubscribe" | "test"
	>("idle");
	const [message, setMessage] = useState<string>("");
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	const refresh = useCallback(async () => {
		const next: Diag = { ...initialDiag, vapidLen: publicKey.length };
		if (typeof window === "undefined") return;

		next.standalone =
			window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
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

	// Close the popover on outside tap or Escape.
	useEffect(() => {
		if (!open) return;
		function onDown(e: MouseEvent | TouchEvent) {
			const t = e.target as Node | null;
			if (t && wrapperRef.current && !wrapperRef.current.contains(t)) {
				setOpen(false);
			}
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onDown);
		document.addEventListener("touchstart", onDown, { passive: true });
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("touchstart", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const t = window.setTimeout(
				() => reject(new Error(`${label} timed out after ${ms}ms`)),
				ms,
			);
			p.then(
				(v) => {
					window.clearTimeout(t);
					resolve(v);
				},
				(e) => {
					window.clearTimeout(t);
					reject(e);
				},
			);
		});
	}

	async function subscribe() {
		setBusy("subscribe");
		setMessage("Requesting OS permission…");
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

			let perm: NotificationPermission;
			try {
				perm = await withTimeout(
					Notification.requestPermission(),
					15000,
					"Notification.requestPermission",
				);
			} catch (err) {
				setMessage(
					`${err instanceof Error ? err.message : "permission request failed"}. ` +
						"iOS caches the dialog dismissal — remove SR Admin from your " +
						"home screen, re-add it via Safari's Share menu, then try again.",
				);
				return;
			}

			if (perm !== "granted") {
				setMessage(
					perm === "denied"
						? "Permission is denied. Open iOS Settings → Notifications → SR Admin and enable them, then retry."
						: `Permission is "${perm}". iOS may have suppressed the dialog — remove and re-add SR Admin to your home screen and try again.`,
				);
				await refresh();
				return;
			}

			setMessage("Permission granted. Creating subscription…");
			let reg = await withTimeout(
				navigator.serviceWorker.getRegistration("/admin/"),
				5000,
				"serviceWorker.getRegistration",
			);
			if (!reg) {
				reg = await withTimeout(
					navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin/" }),
					10000,
					"serviceWorker.register",
				);
			}

			let sub = await reg.pushManager.getSubscription();
			if (!sub) {
				sub = await withTimeout(
					reg.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
					}),
					15000,
					"pushManager.subscribe",
				);
			}

			setMessage("Registering with server…");
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
			setMessage("Subscribed. Tap Test to confirm delivery.");
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
			const reg = await navigator.serviceWorker.getRegistration("/admin/");
			if (!reg) {
				setMessage("No service worker registered on this device.");
				return;
			}
			const sub = await reg.pushManager.getSubscription();
			if (sub) {
				await fetch("/api/admin/push/unsubscribe", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ endpoint: sub.endpoint }),
				}).catch(() => {});
				await sub.unsubscribe();
			}
			setMessage("Notifications disabled on this device.");
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
					`Test push dispatched to ${data.sent ?? 0} subscription(s). ` +
						(data.pruned ? `Pruned ${data.pruned} dead. ` : "") +
						"Check your home screen.",
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

	// Show a small orange dot when there's something Leon should know
	// about — either notifications are off, or the OS blocked them.
	const showBellDot =
		!diag.locallySubscribed || diag.permission === "denied";

	return (
		<div className="notif-bell-wrap" ref={wrapperRef}>
			<button
				type="button"
				className="notif-bell"
				aria-label="Push notifications"
				aria-expanded={open}
				onClick={() => setOpen((v) => !v)}
			>
				<BellIcon silent={!diag.locallySubscribed} />
				{showBellDot && <span className="notif-bell-dot" aria-hidden="true" />}
			</button>

			{open && (
				<div
					className="notif-popover"
					role="dialog"
					aria-label="Push notifications"
				>
					<div className="notif-popover-header">Push notifications</div>

					{diag.locallySubscribed ? (
						// When notifications are on there's nothing to configure —
						// the presence of the "Disable notifications" link is
						// itself the "on" signal. No status line, no test button.
						<button
							type="button"
							className="notif-popover-disable"
							onClick={unsubscribe}
							disabled={busy !== "idle"}
						>
							{busy === "unsubscribe"
								? "Disabling…"
								: "Disable notifications"}
						</button>
					) : (
						<>
							<p className="notif-popover-status">
								{diag.permission === "denied"
									? "Blocked by iOS. Turn on in Settings → Notifications → SR Admin."
									: "Not enabled on this device."}
							</p>
							<div className="notif-popover-actions">
								<button
									type="button"
									className="admin-btn admin-btn--primary"
									onClick={subscribe}
									disabled={busy !== "idle" || !canSubscribe}
								>
									{busy === "subscribe"
										? "Requesting…"
										: canSubscribe
											? "Enable notifications"
											: "Unavailable"}
								</button>
							</div>
							{!canSubscribe && (
								<dl className="notif-popover-diag">
									<dt>Standalone (PWA)</dt>
									<dd>
										{diag.standalone
											? "yes"
											: "no — add to home screen first"}
									</dd>
									<dt>Service Worker</dt>
									<dd>
										{diag.swSupported
											? diag.swActive
												? "active"
												: "registered"
											: "unsupported"}
									</dd>
									<dt>PushManager</dt>
									<dd>{diag.pushSupported ? "supported" : "unsupported"}</dd>
									<dt>Permission</dt>
									<dd>{diag.permission}</dd>
									<dt>VAPID key</dt>
									<dd>
										{diag.vapidLen > 0
											? `${diag.vapidLen} chars`
											: "missing"}
									</dd>
								</dl>
							)}
						</>
					)}

					{message && <p className="notif-popover-msg">{message}</p>}
				</div>
			)}
		</div>
	);
}
