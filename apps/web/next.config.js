import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

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
