import {
	type AnyPgColumn,
	boolean,
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
	// Leon's price for this person's package, in whole euros, replacing
	// the computed one. Lets a discount land on the line itself instead
	// of showing up as an "Adjustment" row on the customer's bill.
	priceOverride?: number | null;
}

/**
 * A booking-level extra (roof rack, etc.) with its own line on the bill.
 * `quantity` because a party can take two racks; `priceOverride` so Leon
 * can discount or comp one without it showing as an adjustment.
 */
export interface BookingAddon {
	key: string;
	quantity: number;
	priceOverride?: number | null;
}

export const bookings = pgTable(
	"bookings",
	{
		id: serial("id").primaryKey(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),

		name: text("name").notNull(),
		email: text("email").notNull(),
		// Optional — collected on the booking form so Leon can jump straight
		// to WhatsApp from the admin detail page. Digits + leading + only.
		phone: text("phone"),

		checkin: text("checkin").notNull(),
		checkout: text("checkout").notNull(),

		// Local Europe/Lisbon wall-clock times for the delivery run and the
		// collection run, "HH:MM", 24h. Null until Leon schedules one —
		// there's a real difference between "no time set yet" and a time, so
		// these must stay nullable rather than defaulting to a fake 09:00.
		// Booking-level: one drop-off trip and one pickup trip, even when
		// items have staggered dates (each item's own date, this time).
		deliveryTime: text("delivery_time"),
		pickupTime: text("pickup_time"),

		accommodation: text("accommodation"),
		peopleCount: integer("people_count").notNull(),
		people: jsonb("people").$type<BookingPerson[]>(),
		message: text("message"),

		// Booking-level extras (roof racks etc.) charged on top of the
		// per-person packages. jsonb so new add-on types need no migration.
		addons: jsonb("addons").$type<BookingAddon[]>(),

		estimatedTotal: integer("estimated_total"),
		finalTotal: integer("final_total"),

		status: bookingStatusEnum("status").default("requested").notNull(),
		ownerNotes: text("owner_notes"),

		stripeChargeId: text("stripe_charge_id"),
		stripeCustomerId: text("stripe_customer_id"),
		// Permanent Stripe Payment Link URL sent with the confirmation email
		// for admin-created bookings. Null when Stripe wasn't available (or
		// the customer pays on arrival).
		stripePaymentLinkUrl: text("stripe_payment_link_url"),
		// Needed to deactivate the link when the price changes — the id
		// isn't derivable from the buy.stripe.com URL.
		stripePaymentLinkId: text("stripe_payment_link_id"),
		// Set by the Stripe webhook when a checkout session for this booking
		// completes. Drives the "payment confirmed" stage + the push to Leon.
		paidAt: timestamp("paid_at"),
		paidAmountCents: integer("paid_amount_cents"),
		// How the money came in: "card" (Stripe webhook) or "cash" (Leon
		// marks a pay-on-delivery booking paid). Null = not paid yet. Without
		// this the Revenue page can only see online card money, so every
		// pay-on-delivery booking is invisible to profit — the biggest P&L
		// distortion for a business whose promise is "you pay on delivery".
		paymentMethod: text("payment_method"),
		// Proof that the confirmation email actually went out. Resend sends
		// server-side, so these never appear in Leon's mail client Sent
		// folder — the admin shows this timestamp + provider id instead.
		confirmationSentAt: timestamp("confirmation_sent_at"),
		confirmationEmailId: text("confirmation_email_id"),

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

/* ── Board inventory ─────────────────────────────────────────────── */

export const boardStatusEnum = pgEnum("board_status", [
	"active",
	"repair",
	"retired",
]);

export type BoardStatus = (typeof boardStatusEnum.enumValues)[number];

export const gearKindEnum = pgEnum("gear_kind", ["board", "wetsuit", "other"]);

export type GearKind = (typeof gearKindEnum.enumValues)[number];

/**
 * The physical fleet — one row per physical item, so each carries its
 * own cost, dings, and (for boards) assignment history. Kind splits the
 * inventory into boards / wetsuits / other gear (ponchos, changing mats,
 * roof racks); only kind=board participates in availability and
 * assignments. `repair`/`retired` items drop out of availability but
 * keep their history. Spend tracking is SUM(purchase_cost) over rows.
 */
export const boards = pgTable(
	"boards",
	{
		id: serial("id").primaryKey(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),

		kind: gearKindEnum("kind").default("board").notNull(),
		// Leon's label, e.g. "7'8 Funboard — blue NSP"
		name: text("name").notNull(),
		// Boards: 6'6 / 7'0 / 7'8 / 8'6 (booking-form values).
		// Wetsuits: XS–XL or kid height ranges. Other gear: free text / empty.
		size: text("size").notNull(),
		// Euros paid. Nullable — some boards predate cost tracking.
		purchaseCost: integer("purchase_cost"),
		purchaseDate: text("purchase_date"),
		status: boardStatusEnum("status").default("active").notNull(),
		notes: text("notes"),
	},
	(t) => ({
		statusIdx: index("boards_status_idx").on(t.status),
	}),
);

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;

/* ── Payments ────────────────────────────────────────────────────── */

/**
 * A ledger of payments against a booking — one row per payment. This is
 * what makes split and partial payments work without corrupting totals: a
 * booking can be €120 on card (via Stripe) plus €40 cash for an upsell,
 * and the two live as separate rows that sum to what was collected.
 *
 * The booking's own paidAt / paidAmountCents / paymentMethod columns are
 * kept as a denormalised summary (recomputed whenever a payment changes)
 * so the dashboard, stage machine and status tags don't each need to sum
 * the ledger. `paidAt` set = the booking is settled (payments ≥ billed).
 */
export const paymentMethodEnum = pgEnum("payment_method_kind", [
	"card",
	"cash",
	"other",
]);
export type PaymentMethodKind = (typeof paymentMethodEnum.enumValues)[number];

export const bookingPayments = pgTable(
	"booking_payments",
	{
		id: serial("id").primaryKey(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		bookingId: integer("booking_id")
			.notNull()
			.references(() => bookings.id, { onDelete: "cascade" }),
		amountCents: integer("amount_cents").notNull(),
		method: paymentMethodEnum("method").notNull(),
		note: text("note"),
		// Stripe charge/session id when the payment came from the webhook,
		// so a re-delivered webhook can't insert the same payment twice.
		stripeChargeId: text("stripe_charge_id"),
	},
	(t) => ({
		bookingIdx: index("booking_payments_booking_idx").on(t.bookingId),
		stripeIdx: index("booking_payments_stripe_idx").on(t.stripeChargeId),
	}),
);

export type BookingPayment = typeof bookingPayments.$inferSelect;
export type NewBookingPayment = typeof bookingPayments.$inferInsert;

/**
 * Which board is out on which booking, for which window. A mid-booking
 * swap = two rows on the same person: the old one truncated to the swap
 * day, the new one starting there, linked via swappedFromId so the detail
 * page can render "7'0 → 7'8 on Aug 12". Dates are inclusive ISO strings,
 * matching the bookings billing rule (delivery and pickup day both count).
 */
export const boardAssignments = pgTable(
	"board_assignments",
	{
		id: serial("id").primaryKey(),
		createdAt: timestamp("created_at").defaultNow().notNull(),

		bookingId: integer("booking_id")
			.notNull()
			.references(() => bookings.id, { onDelete: "cascade" }),
		// Index into the booking's `people` jsonb array — or -1 for
		// booking-level extra gear (roof racks, ponchos, an extra wetsuit)
		// that isn't tied to one person. Extra gear rides the same
		// availability/conflict machinery as boards.
		personIndex: integer("person_index").notNull(),
		boardId: integer("board_id")
			.notNull()
			.references(() => boards.id),

		startDate: text("start_date").notNull(),
		endDate: text("end_date").notNull(),

		swappedFromId: integer("swapped_from_id").references(
			(): AnyPgColumn => boardAssignments.id,
		),
		notes: text("notes"),
	},
	(t) => ({
		boardStartIdx: index("board_assignments_board_start_idx").on(
			t.boardId,
			t.startDate,
		),
		bookingIdx: index("board_assignments_booking_idx").on(t.bookingId),
	}),
);

export type BoardAssignment = typeof boardAssignments.$inferSelect;
export type NewBoardAssignment = typeof boardAssignments.$inferInsert;

/* ── Expenses ────────────────────────────────────────────────────── */

/**
 * Manual operating expenses (paying a driver, fuel, repairs, wax…).
 * Gear purchases live on the fleet rows as purchaseCost — the revenue
 * page combines both so Leon sees whether the business actually makes
 * money. Amounts in whole euros, matching the rest of the app.
 */
export const expenses = pgTable(
	"expenses",
	{
		id: serial("id").primaryKey(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		// The day the money left, ISO date string.
		date: text("date").notNull(),
		label: text("label").notNull(),
		amount: integer("amount").notNull(),
		category: text("category"),
		notes: text("notes"),
	},
	(t) => ({
		dateIdx: index("expenses_date_idx").on(t.date),
	}),
);

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

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

/**
 * Health record for the Google Calendar sync. One row per calendar id.
 *
 * The whole point of this table is that the sync can't fail silently:
 * every run (nightly cron, manual "Sync now", and inline booking writes
 * on failure) stamps its result here, so a broken share, a rotated key
 * or a cron that stopped firing is visible on the dashboard and can
 * trigger a push — rather than being discovered when Leon drives to a
 * pickup that never made it onto his phone.
 */
export const calendarSyncStatus = pgTable("calendar_sync_status", {
	// The Google calendar id (hello@…). Keyed so a second calendar later
	// gets its own row.
	calendarId: text("calendar_id").primaryKey(),
	// When a sync last ran at all — staleness here means the cron stopped.
	lastRunAt: timestamp("last_run_at"),
	// When a sync last fully succeeded.
	lastSuccessAt: timestamp("last_success_at"),
	// Result of the most recent run.
	ok: boolean("ok").default(true).notNull(),
	lastError: text("last_error"),
	// Counts from the most recent run, for the dashboard line.
	bookings: integer("bookings").default(0).notNull(),
	created: integer("created").default(0).notNull(),
	updated: integer("updated").default(0).notNull(),
	deleted: integer("deleted").default(0).notNull(),
	failureCount: integer("failure_count").default(0).notNull(),
	// Runs failed in a row — drives escalation (one blip vs a real outage).
	consecutiveFailures: integer("consecutive_failures").default(0).notNull(),
	// Two-way sync (Google → app). A registered watch channel pushes event
	// changes to our webhook; the sync token drives incremental reads.
	watchChannelId: text("watch_channel_id"),
	watchResourceId: text("watch_resource_id"),
	watchExpiration: timestamp("watch_expiration"),
	syncToken: text("sync_token"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CalendarSyncStatus = typeof calendarSyncStatus.$inferSelect;
