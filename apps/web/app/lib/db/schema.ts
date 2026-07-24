import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const bookingStatusEnum = pgEnum("booking_status", [
	"requested",
	"confirmed",
	"in_progress",
	"cancelled",
	"completed",
]);

export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];

export interface BookingPerson {
	name: string;
	sex: string;
	experience: string;
	package: string;
	board: string;
	wetsuitSize: string;
	// When present, this person's gear runs on their own date window
	// instead of the trip-level checkin/checkout. Optional so historic
	// rows (and same-dates-for-everyone bookings) don't need to store
	// them. The trip-level columns remain the envelope (min/max) so
	// the calendar/dashboard indexes keep working.
	checkin?: string;
	checkout?: string;
}

export const bookings = pgTable(
	"bookings",
	{
		id: serial("id").primaryKey(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),

		name: text("name").notNull(),
		email: text("email").notNull(),

		checkin: text("checkin").notNull(),
		checkout: text("checkout").notNull(),

		accommodation: text("accommodation"),
		peopleCount: integer("people_count").notNull(),
		people: jsonb("people").$type<BookingPerson[]>(),
		message: text("message"),

		estimatedTotal: integer("estimated_total"),
		finalTotal: integer("final_total"),

		status: bookingStatusEnum("status").default("requested").notNull(),
		ownerNotes: text("owner_notes"),

		stripeChargeId: text("stripe_charge_id"),
		stripeCustomerId: text("stripe_customer_id"),

		importedFromResend: timestamp("imported_from_resend"),

		// Soft delete: rows with a non-null deletedAt are filtered out of every
		// admin query (list, calendar, revenue, insights, detail lookup, repeat
		// customer). Keeps a safety net without cluttering the UI. To purge for
		// real, DELETE FROM bookings WHERE deleted_at IS NOT NULL against Neon.
		deletedAt: timestamp("deleted_at"),
	},
	(t) => ({
		statusIdx: index("bookings_status_idx").on(t.status),
		checkinIdx: index("bookings_checkin_idx").on(t.checkin),
		createdAtIdx: index("bookings_created_at_idx").on(t.createdAt),
		deletedAtIdx: index("bookings_deleted_at_idx").on(t.deletedAt),
	}),
);

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

/**
 * Web-push subscriptions from Leon's installed admin PWA. One row per
 * device/browser. The endpoint uniquely identifies a subscription; we
 * upsert on it so re-subscribing on the same device just updates the
 * keys. Delete a row when its endpoint returns 404/410 during send.
 */
export const pushSubscriptions = pgTable(
	"push_subscriptions",
	{
		id: serial("id").primaryKey(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		endpoint: text("endpoint").notNull().unique(),
		p256dh: text("p256dh").notNull(),
		auth: text("auth").notNull(),
		userAgent: text("user_agent"),
	},
	(t) => ({
		endpointIdx: index("push_subscriptions_endpoint_idx").on(t.endpoint),
	}),
);

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
