CREATE TYPE "public"."gear_kind" AS ENUM('board', 'wetsuit', 'other');--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "kind" "gear_kind" DEFAULT 'board' NOT NULL;