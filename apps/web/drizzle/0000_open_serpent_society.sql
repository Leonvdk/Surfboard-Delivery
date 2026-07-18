CREATE TYPE "public"."booking_status" AS ENUM('requested', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"checkin" text NOT NULL,
	"checkout" text NOT NULL,
	"accommodation" text,
	"people_count" integer NOT NULL,
	"people" jsonb,
	"message" text,
	"estimated_total" integer,
	"final_total" integer,
	"status" "booking_status" DEFAULT 'requested' NOT NULL,
	"owner_notes" text,
	"stripe_charge_id" text,
	"stripe_customer_id" text,
	"imported_from_resend" timestamp
);
--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_checkin_idx" ON "bookings" USING btree ("checkin");--> statement-breakpoint
CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");