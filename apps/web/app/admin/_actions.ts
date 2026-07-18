"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "../lib/db/client";
import type { BookingStatus } from "../lib/db/schema";

export async function updateBookingStatus(id: number, status: BookingStatus) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	await db
		.update(schema.bookings)
		.set({ status, updatedAt: new Date() })
		.where(eq(schema.bookings.id, id));
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
	revalidatePath(`/admin/bookings/${id}`);
}

export async function updateFinalTotal(id: number, finalTotal: number | null) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	await db
		.update(schema.bookings)
		.set({ finalTotal, updatedAt: new Date() })
		.where(eq(schema.bookings.id, id));
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
	revalidatePath("/admin");
	revalidatePath("/admin/calendar");
	revalidatePath("/admin/revenue");
	redirect("/admin");
}
