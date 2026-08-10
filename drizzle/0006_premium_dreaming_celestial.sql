ALTER TABLE "user_settings" ADD COLUMN "tempo_api_token" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "jira_account_id" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "ms_client_id" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "ms_client_secret" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "ms_refresh_token" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "auto_tempo_default_rule" jsonb;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "auto_tempo_skip_days" jsonb;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "auto_tempo_rules" jsonb;