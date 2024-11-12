ALTER TABLE "user_scores" ADD COLUMN "eddsa_public_key" text;--> statement-breakpoint
ALTER TABLE "user_scores" ADD CONSTRAINT "user_scores_eddsa_public_key_unique" UNIQUE("eddsa_public_key");