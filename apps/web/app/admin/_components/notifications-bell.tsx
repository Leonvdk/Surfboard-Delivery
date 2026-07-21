"use client";

import Link from "next/link";
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

interface NotificationItem {
	kind: "requested" | "delivery-today" | "pickup-today";
	priority: number;
	bookingId: number;
	href: string;
	title: string;
	body: string;
	dateIso: string;
	notifiedAt: string;
}

const SEEN_STORAGE_KEY = "sra_notifications_seen_at";

function readSeenAt(): string {
	if (typeof window === "undefined") return "";
	try {
		return localStorage.getItem(SEEN_STORAGE_KEY) ?? "";
	} catch {
		return "";
	}
}

function writeSeenAt(iso: string) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(SEEN_STORAGE_KEY, iso);
	} catch {
		// storage may be blocked in some private-browsing modes; ignore
	}
}

function applyAppBadge(count: number) {
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

// Same triangle used in the calendar chip edge markers, kept here so
// the notifications list and the calendar speak the same visual
// language: right = delivery, left = pickup.
function NotifKindIcon({ kind }: { kind: NotificationItem["kind"] }) {
	if (kind === "requested") {
		return (
			<span
				className="notif-item-dot notif-item-dot--requested"
				aria-hidden="true"
			/>
		);
	}
	const points = kind === "delivery-today" ? "1,1 8,4.5 1,8" : "8,1 1,4.5 8,8";
	return (
		<svg
			width={11}
			height={11}
			viewBox="0 0 9 9"
			className={`notif-item-marker notif-item-marker--${kind}`}
			aria-hidden="true"
		>
			<polygon points={points} fill="currentColor" />
		</svg>
	);
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
	const [busy, setBusy] = useState<"idle" | "subscribe" | "unsubscribe">(
		"idle",
	);
	const [message, setMessage] = useState<string>("");
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const [items, setItems] = useState<NotificationItem[] | null>(null);
	const [itemsError, setItemsError] = useState<string | null>(null);
	const [itemsLoading, setItemsLoading] = useState(false);
	// Persisted "last time Leon opened the notifications panel" — anything
	// notified after this counts as unseen and drives the badge + dot.
	const [seenAt, setSeenAt] = useState<string>("");

	const loadItems = useCallback(async () => {
		setItemsLoading(true);
		setItemsError(null);
		try {
			const res = await fetch("/api/admin/notifications", {
				cache: "no-store",
			});
			if (!res.ok) {
				setItemsError(`HTTP ${res.status}`);
				setItems([]);
				return;
			}
			const data = (await res.json()) as { items: NotificationItem[] };
			setItems(data.items);
		} catch (err) {
			setItemsError(err instanceof Error ? err.message : "load failed");
			setItems([]);
		} finally {
			setItemsLoading(false);
		}
	}, []);

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
		void loadItems();
		setSeenAt(readSeenAt());
	}, [refresh, loadItems]);

	// When the popover opens: mark everything as seen NOW, close the
	// badge on the OS icon, and drop the red dot on the bell.
	useEffect(() => {
		if (!open) return;
		void loadItems();
		const nowIso = new Date().toISOString();
		writeSeenAt(nowIso);
		setSeenAt(nowIso);
	}, [open, loadItems]);

	// Count of items that arrived after `seenAt`.
	const unseenCount = (items ?? []).filter(
		(it) => !seenAt || it.notifiedAt > seenAt,
	).length;

	// Drive the OS app-icon badge from unseenCount — but only after we
	// have a definitive answer from the server. `items === null` means
	// "still fetching"; don't clear the badge Leon just saw during that
	// window or it'll flash empty on cold PWA open.
	useEffect(() => {
		if (items === null) return;
		applyAppBadge(unseenCount);
	}, [items, unseenCount]);

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
			// On success, clear the message. The UI itself is the signal:
			// bell dot goes away, popover flips to the "Disable" state.
			setMessage("");
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
			// Same rule as subscribe — the UI's flip back to the "Enable"
			// button is the confirmation. No lingering status text.
			setMessage("");
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

	// Bell dot lights up ONLY for things Leon hasn't seen yet — opening
	// the popover clears both the dot and the app-icon badge. Push-setup
	// warnings still surface here because the fix lives inside the same
	// popover.
	const hasItems = (items?.length ?? 0) > 0;
	const showBellDot =
		unseenCount > 0 || !diag.locallySubscribed || diag.permission === "denied";

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
					aria-label="Notifications"
				>
					<div className="notif-popover-header">Notifications</div>

					{itemsLoading && items === null ? (
						<p className="notif-popover-status">Loading…</p>
					) : itemsError ? (
						<p className="notif-popover-status">
							Couldn&apos;t load: {itemsError}
						</p>
					) : hasItems ? (
						<ul className="notif-list">
							{items?.map((it) => (
								<li key={`${it.kind}-${it.bookingId}`}>
									<Link
										href={it.href}
										className={`notif-item notif-item--${it.kind}`}
										onClick={() => setOpen(false)}
									>
										<NotifKindIcon kind={it.kind} />
										<span className="notif-item-body">
											<span className="notif-item-title">{it.title}</span>
											<span className="notif-item-desc">{it.body}</span>
										</span>
										<span className="notif-item-chev" aria-hidden="true">
											→
										</span>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p className="notif-popover-empty">
							You&apos;re all caught up. No requests waiting, no
							deliveries or pickups today.
						</p>
					)}

					<div className="notif-popover-divider" />

					<div className="notif-popover-push-header">Push notifications</div>

					{diag.locallySubscribed ? (
						<button
							type="button"
							className="notif-popover-disable"
							onClick={unsubscribe}
							disabled={busy !== "idle"}
						>
							{busy === "unsubscribe"
								? "Disabling…"
								: "Disable push notifications"}
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
											? "Enable push notifications"
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
