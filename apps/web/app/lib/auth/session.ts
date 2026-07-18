import type { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface AdminSession {
	authenticated: boolean;
	loggedInAt?: number;
}

const SESSION_PASSWORD = process.env.SESSION_SECRET;

// 90 days ≈ 3 months. iron-session's ttl (top-level) validates freshness on
// unseal — if we only set cookieOptions.maxAge, the cookie sticks around but
// iron-session rejects it after its default 14-day ttl, silently kicking the
// user back to the login page. Both need to line up.
const THREE_MONTHS_SECONDS = 60 * 60 * 24 * 90;

export const sessionOptions: SessionOptions = {
	// iron-session requires a 32+ char password. During local dev without a
	// SESSION_SECRET we fall back to a fixed dev-only value so the app boots;
	// production deploys must set SESSION_SECRET to something real.
	password:
		SESSION_PASSWORD && SESSION_PASSWORD.length >= 32
			? SESSION_PASSWORD
			: "dev-session-password-change-me-please-32chars",
	cookieName: "sra_admin_session",
	ttl: THREE_MONTHS_SECONDS,
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		sameSite: "lax",
		maxAge: THREE_MONTHS_SECONDS,
	},
};

export async function getAdminSession() {
	const cookieStore = await cookies();
	return getIronSession<AdminSession>(cookieStore, sessionOptions);
}
