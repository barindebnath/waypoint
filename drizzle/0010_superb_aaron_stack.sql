ALTER TABLE "ticket_row" ADD COLUMN "pr_refs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
-- Move PR entries out of secondary_refs into pr_refs. Drop the kind key, because pr_refs has no kind.
-- Keep every other secondary ref. Only rows that hold a PR change.
UPDATE "ticket_row" SET
  "pr_refs" = COALESCE((SELECT jsonb_agg(elem - 'kind') FROM jsonb_array_elements("secondary_refs") AS elem WHERE elem->>'kind' = 'github_pr'), '[]'::jsonb),
  "secondary_refs" = COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements("secondary_refs") AS elem WHERE elem->>'kind' IS DISTINCT FROM 'github_pr'), '[]'::jsonb)
WHERE "secondary_refs" @> '[{"kind":"github_pr"}]'::jsonb;
