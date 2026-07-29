CREATE TABLE IF NOT EXISTS "calendar_sync_status" (
	"calendar_id" text PRIMARY KEY NOT NULL,
	"last_run_at" timestamp,
	"last_success_at" timestamp,
	"ok" boolean DEFAULT true NOT NULL,
	"last_error" text,
	"bookings" integer DEFAULT 0 NOT NULL,
	"created" integer DEFAULT 0 NOT NULL,
	"updated" integer DEFAULT 0 NOT NULL,
	"deleted" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
