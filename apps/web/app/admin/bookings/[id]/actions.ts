"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "../../../lib/db/client";
import type { BookingStatus } from "../../../lib/db/schema";

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
