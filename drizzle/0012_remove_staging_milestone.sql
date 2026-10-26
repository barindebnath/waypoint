-- Remove the Staging milestone and its three sub-tasks from the Support (full) and Feature pipelines.
-- Rows still at Staging move to QA & Review. Staging sub-task and milestone state is deleted.
-- Production rows that are not at Staging keep their state.
UPDATE "ticket_row" SET "current_milestone" = 'qa_review', "updated_at" = now() WHERE "current_milestone" = 'staging';--> statement-breakpoint
DELETE FROM "subtask_state" WHERE "milestone_key" = 'staging';--> statement-breakpoint
DELETE FROM "milestone_state" WHERE "milestone_key" = 'staging';--> statement-breakpoint
-- Stored pipeline definitions: keep every milestone except staging, in the original order.
UPDATE "pipeline_definition" SET "definition" = jsonb_set(
  "definition",
  '{milestones}',
  (
    SELECT COALESCE(jsonb_agg(m ORDER BY ord), '[]'::jsonb)
    FROM jsonb_array_elements("definition" -> 'milestones') WITH ORDINALITY AS t(m, ord)
    WHERE m ->> 'key' <> 'staging'
  )
) WHERE "key" IN ('support_full', 'feature');
