import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/auth/session";
import { getDb, schema } from "../../../../lib/db/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const session = await getAdminSession();
	if (!session.authenticated) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const db = getDb();
	if (!db) {
		return NextResponse.json({ error: "db not configured" }, { status: 503 });
	}
	const { endpoint } = (await request.json()) as { endpoint?: string };
	if (!endpoint) {
		return NextResponse.json({ error: "bad payload" }, { status: 400 });
	}
	await db
		.delete(schema.pushSubscriptions)
		.where(eq(schema.pushSubscriptions.endpoint, endpoint));
	return NextResponse.json({ ok: true });
}
