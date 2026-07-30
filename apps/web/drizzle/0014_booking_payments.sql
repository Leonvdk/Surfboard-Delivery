DO $$ BEGIN
 CREATE TYPE "payment_method_kind" AS ENUM('card', 'cash', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"booking_id" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"method" "payment_method_kind" NOT NULL,
	"note" text,
	"stripe_charge_id" text
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_payments_booking_idx" ON "booking_payments" ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_payments_stripe_idx" ON "booking_payments" ("stripe_charge_id");--> statement-breakpoint
INSERT INTO "booking_payments" ("booking_id", "amount_cents", "method", "created_at")
SELECT "id", "paid_amount_cents", COALESCE("payment_method", 'card')::"payment_method_kind", "paid_at"
FROM "bookings"
WHERE "paid_at" IS NOT NULL AND "paid_amount_cents" IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM "booking_payments" p WHERE p."booking_id" = "bookings"."id");
