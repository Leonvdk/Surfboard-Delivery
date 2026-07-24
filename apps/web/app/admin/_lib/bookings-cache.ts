import { desc, isNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb, schema } from "../../lib/db/client";
import type { Booking } from "../../lib/db/schema";

/**
 * Single shared, cached bookings dataset for the whole admin panel.
 *
 * Every admin surface (dashboard, calendar, detail, revenue, badge) used to
 * fire its own Neon HTTP queries on every navigation — the reason the PWA
 * felt slow on open and on tab switches. At Leon's volume (a few hundred
 * rows) one cached SELECT serves everything; pages filter in JS.
 *
 * Freshness: every mutation calls revalidateBookings() (server actions and
 * the public /api/contact insert), so a change is visible on the very next
 * render. The 5-minute revalidate is only a safety net for writes that
 * bypass the app (SQL console, import script run outside Next).
 */

export const BOOKINGS_TAG = "bookings";

// unstable_cache serializes results to JSON, so timestamp columns come back
// as ISO strings on cache hits. Rehydrate so callers keep using Date methods.
function rehydrate(row: Booking): Booking {
	return {
		...row,
		createdAt: new Date(row.createdAt),
		updatedAt: new Date(row.updatedAt),
		importedFromResend: row.importedFromResend
			? new Date(row.importedFromResend)
			: null,
		deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
		paidAt: row.paidAt ? new Date(row.paidAt) : null,
	};
}

const fetchAllBookings = unstable_cache(
	async (): Promise<Booking[] | null> => {
		const db = getDb();
		if (!db) return null;
		return db
			.select()
			.from(schema.bookings)
			.where(isNull(schema.bookings.deletedAt))
			.orderBy(desc(schema.bookings.createdAt));
	},
	["admin-all-bookings"],
	{ tags: [BOOKINGS_TAG], revalidate: 300 },
);

/** All non-deleted bookings, newest first. Null when DATABASE_URL is unset. */
export async function getCachedBookings(): Promise<Booking[] | null> {
	const rows = await fetchAllBookings();
	return rows ? rows.map(rehydrate) : null;
}
