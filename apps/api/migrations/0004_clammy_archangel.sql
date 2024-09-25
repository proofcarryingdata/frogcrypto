DO $$ BEGIN
 CREATE TYPE "public"."social_request_status" AS ENUM('pending', 'connected', 'declined');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"party1" text NOT NULL,
	"party2" text NOT NULL,
	"party1_pod" text,
	"party1_pod_timestamp" timestamp,
	"party2_pod" text,
	"party2_pod_timestamp" timestamp,
	"status" "social_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "social_requests_party1_party2_unique" UNIQUE("party1","party2")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spirit_frogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"frog_id" integer NOT NULL,
	"pod" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "spirit_frogs_frog_id_unique" UNIQUE("frog_id")
);
