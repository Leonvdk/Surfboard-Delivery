import { getIronSession } from "iron-session";
import { type NextRequest, NextResponse } from "next/server";
import type { AdminSession } from "./app/lib/auth/session";
import { sessionOptions } from "./app/lib/auth/session";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	if (!pathname.startsWith("/admin")) return NextResponse.next();
	if (PUBLIC_ADMIN_PATHS.includes(pathname)) return NextResponse.next();

	const res = NextResponse.next();
	const session = await getIronSession<AdminSession>(req, res, sessionOptions);

	if (!session.authenticated) {
		const url = req.nextUrl.clone();
		url.pathname = "/admin/login";
		url.searchParams.set("next", pathname);
		return NextResponse.redirect(url);
	}

	return res;
}

export const config = {
	matcher: ["/admin/:path*"],
};
