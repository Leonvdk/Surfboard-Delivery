"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "../lib/db/client";

/**
 * Manual operating expenses (driver pay, fuel, repairs, wax…). Gear
 * purchases are NOT entered here — they live on the fleet rows and the
 * revenue page combines both. Same server-action conventions as the
 * rest of the admin.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function addExpense(formData: FormData) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");

	const date = ((formData.get("date") as string) ?? "").trim();
	const label = ((formData.get("label") as string) ?? "").trim();
	const amountRaw = ((formData.get("amount") as string) ?? "").trim();
	const category = ((formData.get("category") as string) ?? "").trim();
	const notes = ((formData.get("notes") as string) ?? "").trim();

	const amount = Number.parseInt(amountRaw, 10);
	if (!ISO_DATE.test(date) || !label || !Number.isFinite(amount) || amount <= 0) {
		return;
	}

	await db.insert(schema.expenses).values({
		date,
		label,
		amount,
		category: category || null,
		notes: notes || null,
	});
	revalidatePath("/admin/revenue");
}

export async function deleteExpense(id: number) {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
	revalidatePath("/admin/revenue");
}
