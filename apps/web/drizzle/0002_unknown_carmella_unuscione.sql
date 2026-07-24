CREATE TYPE "public"."board_status" AS ENUM('active', 'repair', 'retired');--> statement-breakpoint
CREATE TABLE "board_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"booking_id" integer NOT NULL,
	"person_index" integer NOT NULL,
	"board_id" integer NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"swapped_from_id" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "boards" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"size" text NOT NULL,
	"purchase_cost" integer,
	"purchase_date" text,
	"status" "board_status" DEFAULT 'active' NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "board_assignments" ADD CONSTRAINT "board_assignments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_assignments" ADD CONSTRAINT "board_assignments_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_assignments" ADD CONSTRAINT "board_assignments_swapped_from_id_board_assignments_id_fk" FOREIGN KEY ("swapped_from_id") REFERENCES "public"."board_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "board_assignments_board_start_idx" ON "board_assignments" USING btree ("board_id","start_date");--> statement-breakpoint
CREATE INDEX "board_assignments_booking_idx" ON "board_assignments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "boards_status_idx" ON "boards" USING btree ("status");