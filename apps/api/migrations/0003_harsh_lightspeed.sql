ALTER TABLE "frogs" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "user_ids" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "frogs" ADD CONSTRAINT "frogs_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "user_scores" ADD CONSTRAINT "user_scores_semaphore_id_unique" UNIQUE("semaphore_id");