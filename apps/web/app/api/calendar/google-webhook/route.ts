import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { applyGoogleChanges, getCalendarConfig } from "../../../lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Receives Google Calendar push notifications for two-way sync.
 *
 * Google POSTs here (no useful body — the signal is in the headers) every
 * time an event on the watched calendar changes. We verify the channel
 * token we set at watch time, then pull the changed events and write back
 * the edited time/location to the booking. It always answers 200, even on
 * internal error: a non-2xx makes Google retry aggressively, and the
 * nightly re-assert already covers anything we drop.
 *
 * The webhook writes the DB directly and never pushes back to Google, so
 * there's no feedback loop.
 */
export async function POST(request: Request) {
	const cfg = getCalendarConfig();
	// Nothing to do if the integration isn't configured — ack so Google
	// doesn't retry.
	if (!cfg) return new NextResponse(null, { status: 200 });

	// The channel token proves it's really our channel. Set at watch time
	// to CALENDAR_FEED_TOKEN.
	const expected = process.env.CALENDAR_FEED_TOKEN;
	const got = request.headers.get("x-goog-channel-token");
	if (expected && got !== expected) {
		return new NextResponse("forbidden", { status: 403 });
	}

	// Google sends one "sync" ping when the channel is created — just ack it.
	const state = request.headers.get("x-goog-resource-state");
	if (state === "sync") return new NextResponse(null, { status: 200 });

	try {
		const { changedBookingIds } = await applyGoogleChanges();
		if (changedBookingIds.length > 0) {
			// Refresh the admin's cached bookings so the write-back shows.
			revalidateTag("bookings", "max");
		}
	} catch (err) {
		console.error("[gcal] webhook error:", err);
	}
	return new NextResponse(null, { status: 200 });
}
