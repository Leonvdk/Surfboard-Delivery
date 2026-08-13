ALTER TABLE "marketing_links" DROP COLUMN IF EXISTS "label";--> statement-breakpoint
ALTER TABLE "marketing_links" ADD COLUMN IF NOT EXISTS "tags" jsonb;
