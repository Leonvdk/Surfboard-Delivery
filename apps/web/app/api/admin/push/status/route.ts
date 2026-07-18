import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/auth/session";
import { getDb, schema } from "../../../../lib/db/client";

export const runtime = "nodejs";

export async function GET() {
	const session = await getAdminSession();
	if (!session.authenticated) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const db = getDb();
	if (!db) {
		return NextResponse.json({ error: "db not configured" }, { status: 503 });
	}
	const rows = await db
		.select({
			id: schema.pushSubscriptions.id,
			createdAt: schema.pushSubscriptions.createdAt,
			userAgent: schema.pushSubscriptions.userAgent,
		})
		.from(schema.pushSubscriptions);
	return NextResponse.json({
		count: rows.length,
		subscriptions: rows.map((r) => ({
			id: r.id,
			createdAt: r.createdAt,
			userAgent: r.userAgent ?? "unknown",
		})),
		vapidConfigured:
			!!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
			!!process.env.VAPID_PRIVATE_KEY,
	});
}
