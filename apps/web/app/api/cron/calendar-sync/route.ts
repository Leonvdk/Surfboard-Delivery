import { NextResponse } from "next/server";
import {
	ensureWatch,
	getCalendarConfig,
	getSyncHealth,
	syncForwardWindow,
} from "../../../lib/google-calendar";
import { sendPushToAll } from "../../../lib/push";

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
 * It also closes the "silent failure" gap: the run records its outcome to
 * the health row, and if it fails — or recovers — Leon gets a push. A
 * calendar that quietly stops syncing is exactly how you end up driving to
 * a pickup that never reached your phone.
 */
function isAuthorized(request: Request): boolean {
	const secret = process.env.CRON_SECRET;
	if (!secret) return true; // Not configured yet — permit for early testing.
	if (request.headers.get("authorization") === `Bearer ${secret}`) return true;
	return new URL(request.url).searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
	if (!isAuthorized(request)) {
		return NextResponse.json({ error: "forbidden" }, { status: 403 });
	}
	if (!getCalendarConfig()) {
		return NextResponse.json({ error: "calendar not configured" }, { status: 503 });
	}

	// Was the last run already failing? Used to detect a recovery so we can
	// tell Leon "it's back" rather than staying silent.
	const before = await getSyncHealth();
	const wasFailing = before.status ? !before.status.ok || before.stale : false;

	const result = await syncForwardWindow();

	// Keep the two-way push channel alive — re-register if it's missing or
	// near expiry. A lapsed channel would silently stop write-back, so a
	// renewal failure is pushed like any other.
	try {
		const watch = await ensureWatch();
		if (watch && !watch.ok) {
			await sendPushToAll({
				title: "Two-way calendar sync needs attention",
				body: `Live sync channel couldn't renew. Tap to re-enable.`,
				url: "/admin/calendar",
				tag: "calendar-watch-health",
			}).catch((err) => console.error("[gcal] watch push error:", err));
		}
	} catch (err) {
		console.error("[gcal] ensureWatch error:", err);
	}

	// Actively alert on failure — never rely on Leon thinking to check.
	if (!result.ok) {
		await sendPushToAll({
			title: "Calendar sync failed",
			body: `${result.failures.length} booking(s) didn't reach Google. Tap to see why.`,
			url: "/admin/calendar",
			tag: "calendar-sync-health",
		}).catch((err) => console.error("[gcal] failure push error:", err));
	} else if (wasFailing) {
		await sendPushToAll({
			title: "Calendar sync recovered",
			body: `Back to normal — ${result.bookings} booking(s) in sync.`,
			url: "/admin/calendar",
			tag: "calendar-sync-health",
		}).catch((err) => console.error("[gcal] recovery push error:", err));
	}

	return NextResponse.json(result);
}
