ALTER TABLE "user_settings" ADD COLUMN "tempo_reviewer_id" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "tempo_submit_scheduled" boolean DEFAULT false NOT NULL;