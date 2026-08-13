CREATE TYPE "public"."link_category" AS ENUM('social', 'marketing', 'partner');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "marketing_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"label" text NOT NULL,
	"category" "link_category" NOT NULL,
	"destination" text NOT NULL,
	"source" text NOT NULL,
	"medium" text NOT NULL,
	"campaign" text NOT NULL,
	"url" text NOT NULL
);
