DROP TABLE "user_ids";--> statement-breakpoint
ALTER TABLE "user_scores" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;