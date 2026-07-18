import { and, eq, isNull, or } from "drizzle-orm";
import { getDb, schema } from "../../lib/db/client";

function todayInLisbon(): string {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Europe/Lisbon",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date());
	const y = parts.find((p) => p.type === "year")?.value;
	const m = parts.find((p) => p.type === "month")?.value;
	const d = parts.find((p) => p.type === "day")?.value;
	return `${y}-${m}-${d}`;
}

/**
 * The number Leon actually cares about seeing on the home-screen icon:
 *   - all requested bookings (not yet confirmed → needs a decision)
 *   - plus today's deliveries that haven't started yet (needs to go out)
 * Excludes soft-deleted rows and cancelled/completed statuses.
 */
export async function computeBadgeCount(): Promise<number> {
	const db = getDb();
	if (!db) return 0;
	const today = todayInLisbon();

	const rows = await db
		.select({ status: schema.bookings.status, checkin: schema.bookings.checkin })
		.from(schema.bookings)
		.where(
			and(
				isNull(schema.bookings.deletedAt),
				or(
					eq(schema.bookings.status, "requested"),
					and(
						eq(schema.bookings.checkin, today),
						or(
							eq(schema.bookings.status, "confirmed"),
							eq(schema.bookings.status, "in_progress"),
						),
					),
				),
			),
		);

	return rows.length;
}
