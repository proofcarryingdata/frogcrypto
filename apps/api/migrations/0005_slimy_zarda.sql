DROP TABLE "spirit_frogs";--> statement-breakpoint
ALTER TABLE "user_scores" ALTER COLUMN "score" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_scores" ADD COLUMN "friend_count" integer DEFAULT 0 NOT NULL;