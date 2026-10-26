/**
 * Pipeline definitions — the canonical seed data for the three pipelines.
 *
 * These are stored in the `pipeline_definition` table (config/data, not code)
 * so milestones/sub-tasks can be edited without a deploy; this module is the
 * typed seed source and single source of truth for fresh databases.
 */

export type SubtaskDef = {
  key: string;
  label: string;
};

export type MilestoneDef = {
  key: string;
  label: string;
  subtasks: SubtaskDef[];
};

export type PipelineDef = {
  key: PipelineKey;
  label: string;
  origin: "support" | "product";
  milestones: MilestoneDef[];
};

export type PipelineKey = "support_full" | "support_light" | "feature";

export const PIPELINES: Record<PipelineKey, PipelineDef> = {
  support_full: {
    key: "support_full",
    label: "Support",
    origin: "support",
    milestones: [
      {
        key: "triage",
        label: "Triage & Setup",
        subtasks: [
          { key: "zt_picked_up", label: "Pick up ZT" },
          { key: "classified_bug", label: "Classify as Bug" },
          { key: "dupe_bug_created", label: "Create dupe Bug in team project and link to ZT" },
          { key: "investment_category", label: "Add investment category" },
        ],
      },
      {
        key: "development",
        label: "Development",
        subtasks: [
          { key: "fix_implemented", label: "Implement fix" },
          { key: "tested_locally", label: "Test locally" },
          { key: "branch_created", label: "Create branch" },
          { key: "code_committed", label: "Commit code" },
          { key: "pr_raised", label: "Raise PR" },
        ],
      },
      {
        key: "qa_review",
        label: "QA & Review",
        subtasks: [
          { key: "tested_staging", label: "Test on staging" },
          { key: "pr_reviewed", label: "Review and approve PR" },
        ],
      },
      {
        key: "prod_close",
        label: "Production & Close-out",
        subtasks: [
          { key: "merged_main", label: "Merge to main" },
          { key: "deployed_prod", label: "Deploy to prod" },
          { key: "release_announcement", label: "Announce release in Eng Releases" },
          { key: "tested_prod", label: "Test on prod" },
          { key: "comment_project_card", label: "Comment on project card (dev/QA language) and move to Done" },
          { key: "comment_zt", label: "Comment on ZT (support language)" },
          { key: "zt_closed", label: "Close ZT or hand it to L2" },
        ],
      },
    ],
  },
  support_light: {
    key: "support_light",
    label: "Support · light",
    origin: "support",
    milestones: [
      {
        key: "triage",
        label: "Triage & Setup",
        subtasks: [
          { key: "zt_picked_up", label: "Pick up ZT" },
          { key: "classified_task", label: "Classify as Task" },
          { key: "investment_category", label: "Add investment category" },
        ],
      },
      {
        key: "resolution",
        label: "Resolution",
        subtasks: [
          { key: "fix_prepared", label: "Prepare fix/query" },
          { key: "run_against_db", label: "Run against DB" },
          { key: "result_verified", label: "Verify result" },
          { key: "result_shared", label: "Share result with support" },
        ],
      },
      {
        key: "closeout",
        label: "Close-out",
        subtasks: [
          { key: "comment_zt", label: "Comment on ZT (support language)" },
          { key: "zt_closed", label: "Close ZT or assign it back" },
        ],
      },
    ],
  },
  feature: {
    key: "feature",
    label: "Feature",
    origin: "product",
    milestones: [
      {
        key: "definition",
        label: "Definition",
        subtasks: [
          { key: "investment_category", label: "Add investment category" },
          { key: "estimates_added", label: "Add Dev/QA estimates in Jira fields" },
          { key: "acceptance_criteria", label: "Confirm acceptance criteria are present" },
          { key: "moved_in_progress", label: "Move to In Progress" },
        ],
      },
      {
        key: "development",
        label: "Development",
        subtasks: [
          { key: "worked_on_card", label: "Work on card" },
          { key: "tested_locally", label: "Test locally" },
          { key: "branch_created", label: "Create branch" },
          { key: "code_committed", label: "Commit code" },
          { key: "pr_raised", label: "Raise PR" },
          { key: "card_code_review", label: "Move card to Code Review" },
        ],
      },
      {
        key: "qa_review",
        label: "QA & Review",
        subtasks: [
          { key: "tested_staging", label: "Test on staging (In QA)" },
          { key: "pr_reviewed", label: "Review and approve PR" },
        ],
      },
      {
        key: "prod_close",
        label: "Production & Close",
        subtasks: [
          { key: "merged_main", label: "Merge to main" },
          { key: "deployed_prod", label: "Deploy to prod" },
          { key: "release_announcement", label: "Announce release in Eng Releases" },
          { key: "card_done", label: "Move card to Done" },
        ],
      },
    ],
  },
};

export const PIPELINE_KEYS = Object.keys(PIPELINES) as PipelineKey[];

/** Default pipeline for a given origin + sub-type (overridable at creation). */
export function defaultPipeline(origin: "support" | "product", subType: "bug" | "task" | null): PipelineKey {
  if (origin === "product") return "feature";
  return subType === "task" ? "support_light" : "support_full";
}
