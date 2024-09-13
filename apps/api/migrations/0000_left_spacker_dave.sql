CREATE TABLE IF NOT EXISTS "frogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid NOT NULL,
	"frog" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
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
CREATE TABLE IF NOT EXISTS "user_ids" (
	"id" serial PRIMARY KEY NOT NULL,
	"semaphore_id" text NOT NULL,
	"auth_semaphore_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
