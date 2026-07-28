import { and, gte, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "../../../lib/db/client";
import { getCalendarConfig, syncBookingToCalendar } from "../../../lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Google calls add up across a season's bookings; give the run room.
export const maxDuration = 300;

/**
 * Nightly repair pass over the Google Calendar.
 *
 * Every booking mutation already syncs inline, but those are best-effort by
 * design — a booking save must never fail because Google was briefly down or
 * a key was mid-rotation. This is what makes that safe: it re-asserts the
 * whole forward window, so any run that failed to write, or was edited
 * directly in Google and drifted, is corrected within a day.
 *
 * Idempotent — a booking already in sync costs one PUT and changes nothing.
 */
function isAuthorized(request: Request): boolean {
	const secret = process.env.CRON_SECRET;
	if (!secret) return true; // Not configured yet — permit for early testing.
	if (request.headers.get("authorization") === `Bearer ${secret}`) return true;
	return new URL(request.url).searchParams.get("secret") === secret;
}

/** Yesterday, so a run that just happened still gets corrected if it drifted. */
function windowStart(): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
	if (!isAuthorized(request)) {
		return NextResponse.json({ error: "forbidden" }, { status: 403 });
	}
	if (!getCalendarConfig()) {
		return NextResponse.json({ error: "calendar not configured" }, { status: 503 });
	}
	const db = getDb();
	if (!db) {
		return NextResponse.json({ error: "db not configured" }, { status: 503 });
	}

	// Cancelled bookings are deliberately included: syncBookingToCalendar
	// resolves them to zero events, which is how a cancellation that failed
	// to propagate gets cleaned out of the calendar.
	const rows = await db
		.select()
		.from(schema.bookings)
		.where(
			and(
				isNull(schema.bookings.deletedAt),
				gte(schema.bookings.checkout, windowStart()),
			),
		);

	let created = 0;
	let updated = 0;
	let deleted = 0;
	const failures: Array<{ id: number; error: string }> = [];

	for (const booking of rows) {
		const result = await syncBookingToCalendar(booking);
		if (result.ok) {
			created += result.created;
			updated += result.updated;
			deleted += result.deleted;
		} else {
			failures.push({ id: booking.id, error: result.error ?? "unknown" });
		}
	}

	if (failures.length) {
		console.error(`[gcal] nightly resync: ${failures.length} failed`, failures);
	}

	return NextResponse.json({
		bookings: rows.length,
		created,
		updated,
		deleted,
		failures,
	});
}
