import type { Booking } from "../../lib/db/schema";

export interface RepeatCustomerInfo {
	priorCount: number;
	lastCheckin: string | null;
}

/**
 * Given the cached bookings list, a booking id, and an email, returns how
 * many *other* bookings this email already has, plus the most-recent prior
 * checkin. Case-insensitive match. Pure function — no DB roundtrip; the
 * detail page already holds the full cached dataset.
 */
export function getRepeatCustomer(
	allBookings: Booking[],
	currentBookingId: number,
	email: string,
): RepeatCustomerInfo {
	const emailLower = email.toLowerCase();
	const others = allBookings.filter(
		(b) => b.id !== currentBookingId && b.email.toLowerCase() === emailLower,
	);

	if (others.length === 0) return { priorCount: 0, lastCheckin: null };

	const sortedByCheckin = others
		.map((b) => b.checkin)
		.filter((c): c is string => typeof c === "string" && c.length > 0)
		.sort()
		.reverse();

	return {
		priorCount: others.length,
		lastCheckin: sortedByCheckin[0] ?? null,
	};
}
