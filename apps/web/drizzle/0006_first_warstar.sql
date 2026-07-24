CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"date" text NOT NULL,
	"label" text NOT NULL,
	"amount" integer NOT NULL,
	"category" text,
	"notes" text
);
--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("date");