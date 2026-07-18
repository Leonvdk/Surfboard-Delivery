import { and, eq, isNull, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "../../../lib/db/client";
import { sendPushToAll } from "../../../lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel cron pings this with an Authorization header derived from CRON_SECRET.
// We also allow explicit query-param invocations for manual re-runs.
function isAuthorized(request: Request): boolean {
	const secret = process.env.CRON_SECRET;
	if (!secret) return true; // Not configured yet — permit for early testing.
	const header = request.headers.get("authorization");
	if (header === `Bearer ${secret}`) return true;
	const url = new URL(request.url);
	if (url.searchParams.get("secret") === secret) return true;
	return false;
}

function todayInLisbon(): string {
	// Portugal / Costa Vicentina timezone: Europe/Lisbon. The delivery date
	// column is a plain YYYY-MM-DD string (no timezone), so we resolve
	// "today" the same way — by asking Intl for the Lisbon local date.
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Europe/Lisbon",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date());
	const y = parts.find((p) => p.type === "year")?.value;
	const m = parts.find((p) => p.type === "month")?.value;
	const d = parts.find((p) => p.type === "day")?.value;
	return `${y}-${m}-${d}`;
}

export async function GET(request: Request) {
	if (!isAuthorized(request)) {
		return NextResponse.json({ error: "forbidden" }, { status: 403 });
	}

	const db = getDb();
	if (!db) {
		return NextResponse.json({ error: "db not configured" }, { status: 503 });
	}

	const today = todayInLisbon();

	// Every delivery today that isn't cancelled or soft-deleted. Skip
	// completed too — no point pinging Leon about a trip that's already
	// signed off.
	const rows = await db
		.select()
		.from(schema.bookings)
		.where(
			and(
				eq(schema.bookings.checkin, today),
				isNull(schema.bookings.deletedAt),
				ne(schema.bookings.status, "cancelled"),
				ne(schema.bookings.status, "completed"),
			),
		);

	const results: Array<{ id: number; sent: number; pruned: number }> = [];
	for (const b of rows) {
		const res = await sendPushToAll({
			title: `Delivery today · ${b.name}`,
			body: `${b.peopleCount}p · ${b.accommodation ?? "no address on file"}`,
			url: `/admin/bookings/${b.id}`,
			tag: `delivery-${b.id}-${today}`,
			badge: rows.length,
		});
		results.push({ id: b.id, ...res });
	}

	return NextResponse.json({
		date: today,
		count: rows.length,
		results,
	});
}
