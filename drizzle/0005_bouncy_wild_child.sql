CREATE TABLE "jira_status_cache" (
	"card_ref" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status_name" text NOT NULL,
	"status_category" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pr_status_cache" (
	"pr_ref" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"state" text NOT NULL,
	"mergeable_state" text NOT NULL,
	"review_decision" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "jira_email" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "jira_api_token" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "github_pat" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "github_default_org" text;--> statement-breakpoint
ALTER TABLE "jira_status_cache" ADD CONSTRAINT "jira_status_cache_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_status_cache" ADD CONSTRAINT "pr_status_cache_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "jira_cache_user_idx" ON "jira_status_cache" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pr_cache_user_idx" ON "pr_status_cache" USING btree ("user_id");