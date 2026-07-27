ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "delivery_time" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "pickup_time" text;
