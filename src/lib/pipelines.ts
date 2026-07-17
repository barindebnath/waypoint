/**
 * Pipeline definitions — the canonical seed data for the three pipelines.
 *
 * These are stored in the `pipeline_definition` table (config/data, not code)
 * so milestones/sub-tasks can be edited without a deploy; this module is the
 * typed seed source and single source of truth for fresh databases.
 *
 * `humanUsual: true` marks sub-tasks usually done by the human (testing,
 * deploys). It is a soft note rendered in the UI and in AGENTS.md — not an
 * enforced restriction.
 */

export type SubtaskDef = {
  key: string;
  label: string;
  humanUsual?: boolean;
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
          { key: "zt_picked_up", label: "ZT picked up" },
          { key: "classified_bug", label: "Classified as Bug" },
          { key: "dupe_bug_created", label: "Dupe Bug created in team project + linked to ZT" },
          { key: "investment_category", label: "Investment category added" },
        ],
      },
      {
        key: "development",
        label: "Development",
        subtasks: [
          { key: "fix_implemented", label: "Fix implemented" },
          { key: "tested_locally", label: "Tested locally", humanUsual: true },
          { key: "branch_created", label: "Branch created" },
          { key: "code_committed", label: "Code committed" },
          { key: "pr_raised", label: "PR raised" },
        ],
      },
      {
        key: "staging",
        label: "Staging",
        subtasks: [
          { key: "deployed_staging", label: "Deployed to staging", humanUsual: true },
          { key: "staging_post_teams", label: "Staging post in Teams" },
          { key: "card_ready_for_qa", label: "Card to Ready for QA" },
        ],
      },
      {
        key: "qa_review",
        label: "QA & Review",
        subtasks: [
          { key: "tested_staging", label: "Tested on staging", humanUsual: true },
          { key: "pr_reviewed", label: "PR reviewed & approved" },
        ],
      },
      {
        key: "prod_close",
        label: "Production & Close-out",
        subtasks: [
          { key: "merged_main", label: "Merged to main" },
          { key: "deployed_prod", label: "Deployed to prod", humanUsual: true },
          { key: "release_announcement", label: "Release announcement in Eng Releases" },
          { key: "tested_prod", label: "Tested on prod", humanUsual: true },
          { key: "comment_project_card", label: "Comment on project card (dev/QA language) + moved to Done" },
          { key: "comment_zt", label: "Comment on ZT (support language)" },
          { key: "zt_closed", label: "ZT closed / handed to L2 to close" },
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
          { key: "zt_picked_up", label: "ZT picked up" },
          { key: "classified_task", label: "Classified as Task" },
          { key: "investment_category", label: "Investment category added" },
        ],
      },
      {
        key: "resolution",
        label: "Resolution",
        subtasks: [
          { key: "fix_prepared", label: "Fix/query prepared" },
          { key: "run_against_db", label: "Run against DB", humanUsual: true },
          { key: "result_verified", label: "Result verified" },
          { key: "result_shared", label: "Result shared with support" },
        ],
      },
      {
        key: "closeout",
        label: "Close-out",
        subtasks: [
          { key: "comment_zt", label: "Comment on ZT (support language)" },
          { key: "zt_closed", label: "ZT closed / assigned back" },
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
          { key: "investment_category", label: "Investment category added" },
          { key: "estimates_added", label: "Dev/QA estimates added in Jira fields" },
          { key: "acceptance_criteria", label: "Acceptance criteria present" },
          { key: "moved_in_progress", label: "Moved to In Progress" },
        ],
      },
      {
        key: "development",
        label: "Development",
        subtasks: [
          { key: "worked_on_card", label: "Worked on card" },
          { key: "tested_locally", label: "Tested locally", humanUsual: true },
          { key: "branch_created", label: "Branch created" },
          { key: "code_committed", label: "Code committed" },
          { key: "pr_raised", label: "PR raised" },
          { key: "card_code_review", label: "Card to Code Review" },
        ],
      },
      {
        key: "staging",
        label: "Staging",
        subtasks: [
          { key: "deployed_staging", label: "Deployed to staging", humanUsual: true },
          { key: "staging_post_teams", label: "Staging post in Teams" },
          { key: "card_ready_for_qa", label: "Card to Ready for QA" },
        ],
      },
      {
        key: "qa_review",
        label: "QA & Review",
        subtasks: [
          { key: "tested_staging", label: "Tested on staging (In QA)", humanUsual: true },
          { key: "pr_reviewed", label: "PR reviewed & approved" },
        ],
      },
      {
        key: "prod_close",
        label: "Production & Close",
        subtasks: [
          { key: "merged_main", label: "Merged to main" },
          { key: "deployed_prod", label: "Deployed to prod", humanUsual: true },
          { key: "release_announcement", label: "Release announcement in Eng Releases" },
          { key: "card_done", label: "Card moved to Done" },
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
