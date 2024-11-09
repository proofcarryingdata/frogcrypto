DO $$ BEGIN
 CREATE TYPE "public"."social_request_status" AS ENUM('pending', 'connected', 'declined');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_ids" (
	"id" serial PRIMARY KEY NOT NULL,
	"semaphore_id" text NOT NULL,
	"signer_pk" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	CONSTRAINT "user_ids_semaphore_id_signer_pk_unique" UNIQUE("semaphore_id","signer_pk")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cyberfrog_nullifiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"nullifier" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cyberfrog_nullifiers_nullifier_unique" UNIQUE("nullifier")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feeds" (
	"uuid" uuid PRIMARY KEY NOT NULL,
	"feed" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "frogs" (
	"id" integer PRIMARY KEY NOT NULL,
	"uuid" uuid NOT NULL,
	"frog" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "frogs_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "frogsocial_nullifiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"party1" text NOT NULL,
	"party2" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "frogsocial_nullifiers_party1_party2_unique" UNIQUE("party1","party2")
);
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
CREATE TABLE IF NOT EXISTS "user_feeds" (
	"id" serial PRIMARY KEY NOT NULL,
	"semaphore_id" text NOT NULL,
	"feed_id" text NOT NULL,
	"last_fetched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_feeds_semaphore_id_feed_id_unique" UNIQUE("semaphore_id","feed_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"semaphore_id" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"friend_count" integer DEFAULT 0 NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"social_id" uuid,
	"devcon7_ticket_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_scores_semaphore_id_unique" UNIQUE("semaphore_id")
);
