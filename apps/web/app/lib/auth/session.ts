import type { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface AdminSession {
	authenticated: boolean;
	loggedInAt?: number;
}

const SESSION_PASSWORD = process.env.SESSION_SECRET;

export const sessionOptions: SessionOptions = {
	// iron-session requires a 32+ char password. During local dev without a
	// SESSION_SECRET we fall back to a fixed dev-only value so the app boots;
	// production deploys must set SESSION_SECRET to something real.
	password:
		SESSION_PASSWORD && SESSION_PASSWORD.length >= 32
			? SESSION_PASSWORD
			: "dev-session-password-change-me-please-32chars",
	cookieName: "sra_admin_session",
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 30, // 30 days
	},
};

export async function getAdminSession() {
	const cookieStore = await cookies();
	return getIronSession<AdminSession>(cookieStore, sessionOptions);
}
