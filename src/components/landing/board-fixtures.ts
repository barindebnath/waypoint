import type { EnrichedRowView } from "@/lib/client-api";
import { PIPELINES, type PipelineKey } from "@/lib/pipelines";
import { DEMO_JIRA, DEMO_OWNER, DEMO_PRS } from "@/lib/demo-integrations";
import type { GithubPrPreview } from "@/lib/github";

/**
 * Sample Board rows for the landing page. They use the same shapes as the real API
 * and the same Jira and GitHub data as the local demo seed (src/lib/demo-integrations.ts),
 * so the landing page shows the real Board card with realistic content.
 */

type Sample = {
  ref: string;
  /** The key of the matching entry in DEMO_JIRA. */
  demoKey: string;
  pipelineKey: PipelineKey;
  subType: "bug" | "task" | null;
  /** The ref of the linked PR, without the "demo-" repo prefix. */
  pr?: string;
  milestone: string;
  /** How many sub-tasks of the current milestone are done. */
  done: number;
  stageHours: number;
};

const SAMPLES: Sample[] = [
  { ref: "OFF-13702", demoKey: "DEMO-13702", pipelineKey: "feature", subType: null, milestone: "definition", done: 2, stageHours: 20 },
  { ref: "OFF-13698", demoKey: "DEMO-13698", pipelineKey: "feature", subType: null, pr: "hub2-api#574", milestone: "development", done: 5, stageHours: 50 },
  { ref: "ZT-2041", demoKey: "DEMO-2041", pipelineKey: "support_full", subType: "bug", pr: "billing#88", milestone: "development", done: 4, stageHours: 98 },
  { ref: "OFF-13655", demoKey: "DEMO-13655", pipelineKey: "feature", subType: null, pr: "hooks#212", milestone: "staging", done: 1, stageHours: 75 },
  { ref: "ZT-2057", demoKey: "DEMO-2057", pipelineKey: "support_full", subType: "bug", pr: "auth#301", milestone: "qa_review", done: 0, stageHours: 26 },
  { ref: "OFF-13610", demoKey: "DEMO-13610", pipelineKey: "feature", subType: null, pr: "admin-ui#940", milestone: "prod_close", done: 1, stageHours: 122 },
];

function hoursAgo(h: number, now: number): string {
  return new Date(now - h * 3600_000).toISOString();
}

function buildRow(s: Sample, now: number): EnrichedRowView {
  const def = PIPELINES[s.pipelineKey];
  const currentIdx = def.milestones.findIndex((m) => m.key === s.milestone);
  const stageAt = hoursAgo(s.stageHours, now);
  const jira = DEMO_JIRA[s.demoKey];
  const prDemo = s.pr ? DEMO_PRS[`demo-${s.pr}`] : undefined;
  return {
    id: s.ref,
    origin: def.origin,
    subType: s.subType,
    pipelineKey: s.pipelineKey,
    pipelineLabel: def.label,
    identityRef: s.ref,
    identityUrl: null,
    identityResolvedUrl: null,
    jiraStatus: jira ? { statusName: jira.statusName, statusCategory: jira.statusCategory } : undefined,
    secondaryRefs: s.pr
      ? [
          {
            kind: "github_pr",
            ref: s.pr,
            resolvedUrl: null,
            prStatus: prDemo
              ? { state: prDemo.state, mergeableState: prDemo.mergeableState, reviewDecision: prDemo.reviewDecision }
              : null,
          },
        ]
      : [],
    currentMilestone: s.milestone,
    isComplete: false,
    hasLooseEnds: false,
    createdAt: hoursAgo(s.stageHours + 48, now),
    updatedAt: stageAt,
    milestones: def.milestones.map((m, i) => ({
      key: m.key,
      label: m.label,
      complete: i < currentIdx,
      isCurrent: i === currentIdx,
      createdAt: stageAt,
      updatedAt: stageAt,
      subtasks: m.subtasks.map((st, j) => ({
        key: st.key,
        label: st.label,
        checked: i < currentIdx || (i === currentIdx && j < s.done),
        createdAt: stageAt,
        updatedAt: stageAt,
      })),
    })),
  } as EnrichedRowView;
}

export function sampleBoardRows(now = Date.now()): EnrichedRowView[] {
  return SAMPLES.map((s) => buildRow(s, now));
}

/** Resolves a sample ref to the preview the card would get from Jira or GitHub. */
export function samplePreview(ref: string) {
  const sample = SAMPLES.find((s) => s.ref === ref);
  if (sample) {
    const jira = DEMO_JIRA[sample.demoKey];
    return jira ? { ref, title: jira.title, issueType: jira.issueType } : null;
  }
  const pr = DEMO_PRS[`demo-${ref}`];
  if (!pr) return null;
  const [repo, num] = ref.split("#");
  const preview: GithubPrPreview = {
    ...pr,
    owner: DEMO_OWNER,
    repo,
    number: Number(num),
    createdAt: "",
    updatedAt: "",
  };
  return { ref, title: pr.title, pr: preview };
}
