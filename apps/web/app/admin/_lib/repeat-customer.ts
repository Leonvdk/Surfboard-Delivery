import { and, isNull, ne, sql } from "drizzle-orm";
import { getDb, schema } from "../../lib/db/client";

export interface RepeatCustomerInfo {
	priorCount: number;
	lastCheckin: string | null;
}

/**
 * Given a booking id + email, returns how many *other* bookings this email
 * already has in the system, plus the most-recent prior checkin.
 * Case-insensitive match. Returns null when the DB isn't configured.
 */
export async function getRepeatCustomer(
	currentBookingId: number,
	email: string,
): Promise<RepeatCustomerInfo | null> {
	const db = getDb();
	if (!db) return null;

	const rows = await db
		.select({
			checkin: schema.bookings.checkin,
			id: schema.bookings.id,
		})
		.from(schema.bookings)
		.where(
			and(
				sql`lower(${schema.bookings.email}) = lower(${email})`,
				ne(schema.bookings.id, currentBookingId),
				isNull(schema.bookings.deletedAt),
			),
		);

	if (rows.length === 0) return { priorCount: 0, lastCheckin: null };

	const sortedByCheckin = rows
		.map((r) => r.checkin)
		.filter((c): c is string => typeof c === "string" && c.length > 0)
		.sort()
		.reverse();

	return {
		priorCount: rows.length,
		lastCheckin: sortedByCheckin[0] ?? null,
	};
}
