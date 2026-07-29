ALTER TABLE "calendar_sync_status" ADD COLUMN IF NOT EXISTS "watch_channel_id" text;--> statement-breakpoint
ALTER TABLE "calendar_sync_status" ADD COLUMN IF NOT EXISTS "watch_resource_id" text;--> statement-breakpoint
ALTER TABLE "calendar_sync_status" ADD COLUMN IF NOT EXISTS "watch_expiration" timestamp;--> statement-breakpoint
ALTER TABLE "calendar_sync_status" ADD COLUMN IF NOT EXISTS "sync_token" text;
