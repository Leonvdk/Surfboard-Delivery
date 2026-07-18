import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/auth/session";
import { getDb, schema } from "../../../../lib/db/client";

export const runtime = "nodejs";

interface Body {
	endpoint?: string;
	keys?: { p256dh?: string; auth?: string };
	userAgent?: string;
}

export async function POST(request: Request) {
	const session = await getAdminSession();
	if (!session.authenticated) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const db = getDb();
	if (!db) {
		return NextResponse.json({ error: "db not configured" }, { status: 503 });
	}

	const body = (await request.json()) as Body;
	const endpoint = body.endpoint;
	const p256dh = body.keys?.p256dh;
	const auth = body.keys?.auth;
	if (!endpoint || !p256dh || !auth) {
		return NextResponse.json({ error: "bad payload" }, { status: 400 });
	}

	await db
		.insert(schema.pushSubscriptions)
		.values({
			endpoint,
			p256dh,
			auth,
			userAgent: body.userAgent ?? null,
		})
		.onConflictDoUpdate({
			target: schema.pushSubscriptions.endpoint,
			set: {
				p256dh,
				auth,
				userAgent: body.userAgent ?? null,
				createdAt: sql`now()`,
			},
		});

	return NextResponse.json({ ok: true });
}
