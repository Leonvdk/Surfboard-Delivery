import { withSentryConfig } from "@sentry/nextjs";

// Consolidated slugs → their new canonical target. Kept in one place so
// future consolidations can be added in a single line.
const REDIRECT_MAP = {
	"/blog/march-surfing-aljezur": "/blog/best-time-to-surf-aljezur",
	"/blog/april-surfing-aljezur": "/blog/best-time-to-surf-aljezur",
	"/blog/may-surfing-aljezur": "/blog/best-time-to-surf-aljezur",
	"/blog/june-surfing-aljezur": "/blog/best-time-to-surf-aljezur",
	"/blog/july-surfing-aljezur": "/blog/best-time-to-surf-aljezur",
	"/blog/august-surfing-aljezur": "/blog/best-time-to-surf-aljezur",
	"/blog/september-surfing-aljezur": "/blog/best-time-to-surf-aljezur",
	"/blog/october-surfing-aljezur": "/blog/best-time-to-surf-aljezur",
	"/blog/surf-aljezur-from-london": "/blog/getting-to-aljezur",
	"/blog/surf-aljezur-from-amsterdam": "/blog/getting-to-aljezur",
	"/blog/surf-aljezur-from-berlin": "/blog/getting-to-aljezur",
	"/blog/surf-aljezur-from-paris": "/blog/getting-to-aljezur",
	"/blog/surf-aljezur-from-lisbon": "/blog/getting-to-aljezur",
	"/blog/surf-aljezur-from-faro": "/blog/getting-to-aljezur",
};

/** @type {import('next').NextConfig} */
const nextConfig = {
	async redirects() {
		return Object.entries(REDIRECT_MAP).map(([source, destination]) => ({
			source,
			destination,
			permanent: true,
		}));
	},
};

export default withSentryConfig(nextConfig, {
	org: "leonvdk",
	project: "javascript-nextjs",
	silent: !process.env.CI,
	widenClientFileUpload: true,
	tunnelRoute: "/monitoring",
	webpack: {
		treeshake: { removeDebugLogging: true },
		automaticVercelMonitors: false,
	},
});
