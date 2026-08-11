"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "../lib/db/client";
import type { BookingStatus } from "../lib/db/schema";
import {
	type ForwardSyncSummary,
	registerWatch,
	syncBookingSafe,
	syncForwardWindow,
	type WatchResult,
} from "../lib/google-calendar";
import { BOOKINGS_TAG } from "./_lib/bookings-cache";

/**
 * Turn on live two-way sync (Google → app) by registering the push
 * channel now, rather than waiting for the nightly job. Returns the same
 * shape the button renders, including Google's error if the domain isn't
 * verified yet.
 */
export async function enableTwoWaySync(): Promise<WatchResult> {
	const result = await registerWatch();
	revalidatePath("/admin/calendar");
	return result;
}

/**
 * Run the Google Calendar sync on demand from the admin. Returns the same
 * summary the nightly cron produces, so the "Sync now" button can show
 * exactly what happened — including Google's error text on failure, which
 * is the fastest way to tell a missing calendar-share (404) from a bad
 * key (401/403). Also the one-tap way to backfill existing bookings after
 * first configuring the env vars, instead of waiting for 03:30.
 */
export async function syncCalendarNow(): Promise<ForwardSyncSummary> {
	const result = await syncForwardWindow();
	revalidatePath("/admin/calendar");
	revalidatePath("/admin");
	return result;
}

/** Re-read the booking and push it to Google Calendar. Called after any
 * change that could move, add or remove a run. Never throws — see
 * syncBookingSafe. */
async function resyncCalendar(id: number) {
	const db = getDb();
	if (!db) return;
	const [booking] = await db
		.select()
		.from(schema.bookings)
		.where(eq(schema.bookings.id, id))
		.limit(1);
	if (booking) await syncBookingSafe(booking);
}

export async function updateBookingStatus(id: number, status: BookingStatus) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	await db
		.update(schema.bookings)
		.set({ status, updatedAt: new Date() })
		.where(eq(schema.bookings.id, id));
	// Cancelling must clear the runs from the calendar, and un-cancelling
	// must put them back.
	await resyncCalendar(id);
	revalidateTag(BOOKINGS_TAG);
	revalidatePath("/admin");
	revalidatePath(`/admin/bookings/${id}`);
	revalidatePath("/admin/calendar");
}

export async function updateBookingNotes(id: number, ownerNotes: string) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	await db
		.update(schema.bookings)
		.set({ ownerNotes, updatedAt: new Date() })
		.where(eq(schema.bookings.id, id));
	revalidateTag(BOOKINGS_TAG);
	revalidatePath(`/admin/bookings/${id}`);
}

export async function updateFinalTotal(id: number, finalTotal: number | null) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	await db
		.update(schema.bookings)
		.set({ finalTotal, updatedAt: new Date() })
		.where(eq(schema.bookings.id, id));
	revalidateTag(BOOKINGS_TAG);
	revalidatePath(`/admin/bookings/${id}`);
	revalidatePath("/admin/revenue");
}

/**
 * Soft delete — the row stays in the DB but every admin query filters it out.
 * Use this from the detail page's Delete button. Redirects back to /admin so
 * the deleted booking's page isn't left in the browser.
 */
export async function deleteBooking(id: number) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	await db
		.update(schema.bookings)
		.set({ deletedAt: new Date(), updatedAt: new Date() })
		.where(eq(schema.bookings.id, id));
	await resyncCalendar(id);
	revalidateTag(BOOKINGS_TAG);
	revalidatePath("/admin");
	revalidatePath("/admin/calendar");
	revalidatePath("/admin/revenue");
	redirect("/admin");
}
