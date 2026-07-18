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
	},
	(t) => ({
		statusIdx: index("bookings_status_idx").on(t.status),
		checkinIdx: index("bookings_checkin_idx").on(t.checkin),
		createdAtIdx: index("bookings_created_at_idx").on(t.createdAt),
	}),
);

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
