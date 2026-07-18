import * as Sentry from "@sentry/nextjs";

// Errors we never want to page us — they come from browser extensions,
// vendor-injected content scripts, or the browser's own reader-mode
// hooks. They're not our code; nothing we can fix. Match against the
// message string so we drop them before the event ships to Sentry.
const THIRD_PARTY_NOISE = [
	// Brave/Firefox mobile reader-mode content script.
	/window\.__firefox__/,
	/__firefox__\.(reader|metadata|logins|search)/,
	// Common wallet / crypto extension probes.
	/window\.(ethereum|solana|phantom)/,
	// Safari's iOS "no fetch handler" chatter for cancelled navigations.
	/ResizeObserver loop (limit exceeded|completed with undelivered notifications)/,
	// Non-error rejections from third-party async guff.
	/Non-Error promise rejection captured with value: Object Not Found Matching/,
];

Sentry.init({
	dsn: "https://abea9de0ccf18732ec8a42db89ab9970@o4511739034861568.ingest.de.sentry.io/4511739045544016",
	environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
	tracesSampleRate: 0.1,
	enabled: process.env.NODE_ENV === "production",
	ignoreErrors: THIRD_PARTY_NOISE,
	// Also drop anything whose top frame is an extension URL or an
	// unnamed inline `app:///contact:1` script — those never come from
	// our bundle (our frames use `/_next/static/chunks/…`).
	beforeSend(event, hint) {
		const err = hint?.originalException;
		const msg =
			(err instanceof Error ? err.message : "") ||
			event.message ||
			(event.exception?.values?.[0]?.value ?? "");
		if (THIRD_PARTY_NOISE.some((r) => r.test(msg))) return null;

		const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
		const top = frames[frames.length - 1];
		const abs = top?.abs_path ?? "";
		if (
			abs.startsWith("chrome-extension://") ||
			abs.startsWith("moz-extension://") ||
			abs.startsWith("safari-extension://") ||
			abs.startsWith("safari-web-extension://") ||
			// "app://" is the shim URL iOS Safari fabricates for
			// browser-injected inline scripts. Real app code has
			// http(s)://…/_next/… paths.
			abs.startsWith("app:///")
		) {
			return null;
		}
		return event;
	},
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
