ALTER TABLE "bookings" ADD COLUMN "confirmation_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "confirmation_email_id" text;