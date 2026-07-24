ALTER TABLE "bookings" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "paid_amount_cents" integer;