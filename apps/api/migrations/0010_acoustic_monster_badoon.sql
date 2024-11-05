CREATE TABLE IF NOT EXISTS "frogsocial_nullifiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"party1" text NOT NULL,
	"party2" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "frogsocial_nullifiers_party1_party2_unique" UNIQUE("party1","party2")
);
