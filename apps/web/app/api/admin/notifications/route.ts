import { desc, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "../../../lib/auth/session";
import { getDb, schema } from "../../../lib/db/client";
import type { BookingStatus } from "../../../lib/db/schema";
import { todayIso } from "../../../admin/_lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE: BookingStatus[] = ["requested", "confirmed", "in_progress"];

export interface NotificationItem {
	kind: "requested" | "delivery-today" | "pickup-today";
	priority: number;
	bookingId: number;
	href: string;
	title: string;
	body: string;
	dateIso: string;
	/**
	 * When this notification became visible in the panel. For requested
	 * bookings that's when the booking arrived. For date-based items
	 * (today's delivery, today's pickup, next-3-day deliveries) it's the
	 * later of the booking's creation and the Europe/Lisbon start of the
	 * relevant date — so a booking made three weeks ago whose delivery
	 * falls today counts as "new" once today starts, not three weeks ago.
	 * The client compares this against its localStorage-stored
	 * `seenAt` to decide the badge and dot.
	 */
	notifiedAt: string;
}

// Lisbon-relative "start of day" as an ISO string, so we can compare
// against timestamps without pulling in a TZ library.
function lisbonDayStartIso(iso: string): string {
	// iso is YYYY-MM-DD. Portugal is UTC or UTC+1; using 00:00 UTC is
	// close enough for a "did this qualify since X?" comparison.
	return `${iso}T00:00:00.000Z`;
}

function laterIso(a: string, b: string): string {
	return a > b ? a : b;
}

/**
 * All the things Leon should be aware of RIGHT NOW, in one call.
 * Ordered by urgency: requested > delivering today > picking up today >
 * next-72h deliveries.
 */
export async function GET() {
	const session = await getAdminSession();
	if (!session.authenticated) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const db = getDb();
	if (!db) {
		return NextResponse.json({ error: "db not configured" }, { status: 503 });
	}

	const today = todayIso();

	const rows = await db
		.select({
			id: schema.bookings.id,
			name: schema.bookings.name,
			accommodation: schema.bookings.accommodation,
			checkin: schema.bookings.checkin,
			checkout: schema.bookings.checkout,
			status: schema.bookings.status,
			createdAt: schema.bookings.createdAt,
		})
		.from(schema.bookings)
		.where(isNull(schema.bookings.deletedAt))
		.orderBy(desc(schema.bookings.createdAt));

	const items: NotificationItem[] = [];
	const todayStartIso = lisbonDayStartIso(today);

	for (const b of rows) {
		const href = `/admin/bookings/${b.id}`;
		const who = b.name;
		const where = b.accommodation ? ` · ${b.accommodation}` : "";
		const createdIso = b.createdAt.toISOString();

		if (b.status === "requested") {
			items.push({
				kind: "requested",
				priority: 0,
				bookingId: b.id,
				href,
				title: `New request · ${who}`,
				body: `Check-in ${b.checkin}${where}`,
				dateIso: createdIso,
				notifiedAt: createdIso,
			});
			continue;
		}

		if (!ACTIVE.includes(b.status)) continue;

		if (b.checkin === today) {
			items.push({
				kind: "delivery-today",
				priority: 1,
				bookingId: b.id,
				href,
				title: `Delivery today · ${who}`,
				body: `${b.checkin} → ${b.checkout}${where}`,
				dateIso: b.checkin,
				notifiedAt: laterIso(createdIso, todayStartIso),
			});
		} else if (b.checkout === today) {
			items.push({
				kind: "pickup-today",
				priority: 2,
				bookingId: b.id,
				href,
				title: `Pickup today · ${who}`,
				body: `Booked ${b.checkin} → ${b.checkout}${where}`,
				dateIso: b.checkout,
				notifiedAt: laterIso(createdIso, todayStartIso),
			});
		}
		// Future deliveries (checkin > today) intentionally do not become
		// notifications. Leon looks at the calendar for those; the panel is
		// only for "act today" items.
	}

	items.sort((a, b) => {
		if (a.priority !== b.priority) return a.priority - b.priority;
		return a.dateIso.localeCompare(b.dateIso);
	});

	return NextResponse.json({
		items,
		generatedAt: new Date().toISOString(),
	});
}
