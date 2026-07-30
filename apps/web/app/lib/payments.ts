import { eq } from "drizzle-orm";
import { getDb, schema } from "./db/client";

/**
 * Re-derive a booking's denormalised payment summary from its ledger rows.
 * Called after any payment change (add / remove / Stripe webhook). Keeps
 * booking.paidAt/paidAmountCents/paymentMethod in sync so the dashboard,
 * stage machine and status tags keep working off the booking row without
 * summing the ledger themselves. `paidAt` set = settled (payments cover
 * what was billed); a partial payment leaves it null but still records the
 * amount collected so far.
 */
export async function recomputeBookingPaid(bookingId: number): Promise<void> {
	const db = getDb();
	if (!db) return;
	const [b] = await db
		.select()
		.from(schema.bookings)
		.where(eq(schema.bookings.id, bookingId))
		.limit(1);
	if (!b) return;

	const pays = await db
		.select()
		.from(schema.bookingPayments)
		.where(eq(schema.bookingPayments.bookingId, bookingId));

	const total = pays.reduce((s, p) => s + p.amountCents, 0);
	const billedCents = Math.round((b.finalTotal ?? b.estimatedTotal ?? 0) * 100);
	const settled = pays.length > 0 && total >= Math.max(1, billedCents);

	const methods = new Set(pays.map((p) => p.method));
	const method =
		pays.length === 0 ? null : methods.size > 1 ? "mixed" : [...methods][0]!;
	const latest = pays.reduce<Date | null>(
		(mx, p) => (!mx || p.createdAt > mx ? p.createdAt : mx),
		null,
	);

	await db
		.update(schema.bookings)
		.set({
			paidAt: settled ? (latest ?? new Date()) : null,
			paidAmountCents: pays.length ? total : null,
			paymentMethod: method,
			updatedAt: new Date(),
		})
		.where(eq(schema.bookings.id, bookingId));
}
