CREATE TABLE IF NOT EXISTS "cyberfrog_nullifiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"nullifier" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cyberfrog_nullifiers_nullifier_unique" UNIQUE("nullifier")
);
