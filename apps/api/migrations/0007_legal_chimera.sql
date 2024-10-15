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
CREATE TABLE IF NOT EXISTS "feeds" (
	"uuid" uuid PRIMARY KEY NOT NULL,
	"feed" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_scores" ADD COLUMN "social_id" uuid;