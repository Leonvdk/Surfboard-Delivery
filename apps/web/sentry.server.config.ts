import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: "https://abea9de0ccf18732ec8a42db89ab9970@o4511739034861568.ingest.de.sentry.io/4511739045544016",
	environment: process.env.VERCEL_ENV || "development",
	tracesSampleRate: 0.1,
	enabled: process.env.NODE_ENV === "production",
});
