import { and, gte, isNull, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "../../../lib/db/client";
import { buildCalendar } from "../../../lib/ics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Subscribable calendar of every delivery and collection run.
 *
 * The secret is the URL itself — Google Calendar can't send an
 * Authorization header when polling a subscribed feed, so a token in the
 * path is the only workable auth. Treat the URL like a password: anyone
 * holding it can read customer names, addresses and phone numbers. It's
 * under /api/, which robots.txt already disallows, and the response is
 * marked noindex/private for good measure. Rotate by changing
 * CALENDAR_FEED_TOKEN in Vercel and re-subscribing.
 */

/** Constant-time-ish compare so the token can't be guessed byte by byte. */
function safeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

/** Only surface runs from ~3 months back, so the feed can't grow forever. */
function horizonStart(): string {
	const d = new Date();
	d.setUTCMonth(d.getUTCMonth() - 3);
	return d.toISOString().slice(0, 10);
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ token: string }> },
) {
	const { token } = await params;
	const expected = process.env.CALENDAR_FEED_TOKEN;

	if (!expected) {
		return NextResponse.json(
			{ error: "calendar feed not configured" },
			{ status: 503 },
		);
	}
	if (!safeEqual(token, expected)) {
		return new NextResponse("Not found", { status: 404 });
	}

	const db = getDb();
	if (!db) {
		return NextResponse.json({ error: "db not configured" }, { status: 503 });
	}

	// Cancelled bookings are excluded outright — a cancelled run showing up
	// as a calendar entry is how you drive to an empty house.
	const rows = await db
		.select()
		.from(schema.bookings)
		.where(
			and(
				isNull(schema.bookings.deletedAt),
				ne(schema.bookings.status, "cancelled"),
				gte(schema.bookings.checkout, horizonStart()),
			),
		);

	const body = buildCalendar(rows);

	return new NextResponse(body, {
		status: 200,
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": 'inline; filename="surf-rental-runs.ics"',
			"Cache-Control": "no-store, max-age=0",
			"X-Robots-Tag": "noindex, nofollow",
		},
	});
}
