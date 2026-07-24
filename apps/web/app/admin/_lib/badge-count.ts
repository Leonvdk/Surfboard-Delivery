import { getCachedBookings } from "./bookings-cache";

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
 * Reads the shared cached dataset — no extra DB roundtrip.
 */
export async function computeBadgeCount(): Promise<number> {
	const bookings = await getCachedBookings();
	if (!bookings) return 0;
	const today = todayInLisbon();

	return bookings.filter(
		(b) =>
			b.status === "requested" ||
			(b.checkin === today &&
				(b.status === "confirmed" || b.status === "in_progress")),
	).length;
}
