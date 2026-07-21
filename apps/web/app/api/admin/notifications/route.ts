import { desc, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "../../../lib/auth/session";
import { getDb, schema } from "../../../lib/db/client";
import type { BookingStatus } from "../../../lib/db/schema";
import { addDaysIso, todayIso } from "../../../admin/_lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE: BookingStatus[] = ["requested", "confirmed", "in_progress"];

export interface NotificationItem {
	kind: "requested" | "delivery-today" | "pickup-today" | "delivery-soon";
	priority: number;
	bookingId: number;
	href: string;
	title: string;
	body: string;
	dateIso: string;
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
	const in3Days = addDaysIso(today, 3);

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

	for (const b of rows) {
		const href = `/admin/bookings/${b.id}`;
		const who = b.name;
		const where = b.accommodation ? ` · ${b.accommodation}` : "";

		if (b.status === "requested") {
			items.push({
				kind: "requested",
				priority: 0,
				bookingId: b.id,
				href,
				title: `New request · ${who}`,
				body: `Check-in ${b.checkin}${where}`,
				dateIso: b.createdAt.toISOString(),
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
			});
		} else if (b.checkin > today && b.checkin <= in3Days) {
			items.push({
				kind: "delivery-soon",
				priority: 3,
				bookingId: b.id,
				href,
				title: `Delivery ${b.checkin} · ${who}`,
				body: `${b.checkin} → ${b.checkout}${where}`,
				dateIso: b.checkin,
			});
		}
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
