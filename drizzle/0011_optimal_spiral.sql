CREATE TABLE "preview_cache" (
	"user_id" text NOT NULL,
	"ref" text NOT NULL,
	"payload" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "preview_cache_user_id_ref_pk" PRIMARY KEY("user_id","ref")
);
--> statement-breakpoint
ALTER TABLE "preview_cache" ADD CONSTRAINT "preview_cache_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;