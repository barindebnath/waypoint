import type { GithubPrPreview } from "./github";

/**
 * Fake Jira and GitHub data, to see the Board cards without real integrations.
 *
 * The preview endpoint uses this data only if both conditions are true:
 * - NODE_ENV is not "production"
 * - WAYPOINT_DEMO_INTEGRATIONS is "1"
 * A production build therefore never returns fake data, also if the variable is set by mistake.
 *
 * All refs use the DEMO- key prefix or a demo-* repo, so they cannot match a real card or PR.
 * `scripts/seed-demo.ts` makes the rows and the status cache entries for these refs.
 */
export function demoIntegrationsEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.WAYPOINT_DEMO_INTEGRATIONS === "1";
}

type DemoJira = { title: string; issueType: string; statusName: string; statusCategory: "todo" | "inprogress" | "done" };
type DemoPr = Omit<GithubPrPreview, "owner" | "repo" | "number" | "createdAt" | "updatedAt"> & {
  mergeableState: "clean" | "dirty" | "blocked" | "unknown";
  reviewDecision: "approved" | "changes_requested" | "review_required" | "none";
};

export const DEMO_OWNER = "demo-org";

export const DEMO_JIRA: Record<string, DemoJira> = {
  "DEMO-13698": { title: "Support multi-region token exchange", issueType: "Feature", statusName: "In Progress", statusCategory: "inprogress" },
  "DEMO-13702": { title: "Bulk export of attendance records to CSV", issueType: "Story", statusName: "To Do", statusCategory: "todo" },
  "DEMO-13655": { title: "Webhook retries with exponential backoff", issueType: "Feature", statusName: "Code Review", statusCategory: "inprogress" },
  "DEMO-2041": { title: "Invoice PDF shows the wrong tax total for NZ customers", issueType: "Bug", statusName: "In Progress", statusCategory: "inprogress" },
  "DEMO-2057": { title: "Session expires early after a password reset", issueType: "Bug", statusName: "Ready for QA", statusCategory: "inprogress" },
  "DEMO-2063": { title: "Fix duplicate enrolments for one family account", issueType: "Task", statusName: "In Progress", statusCategory: "inprogress" },
  "DEMO-13610": { title: "Audit log filters for admin users", issueType: "Feature", statusName: "In QA", statusCategory: "inprogress" },
  "DEMO-2012": { title: "Timezone offset is wrong on booking reminders", issueType: "Bug", statusName: "Done", statusCategory: "done" },
};

export const DEMO_PRS: Record<string, DemoPr> = {
  "demo-hub2-api#574": { title: "Add token refresh hooks & redis cache for regional tokens", state: "open", authorLogin: "demo-dev", authorAvatarUrl: null, additions: 342, deletions: 58, changedFiles: 14, unresolvedThreads: 0, mergeableState: "clean", reviewDecision: "approved" },
  "demo-hooks#212": { title: "Retry failed webhook deliveries with backoff and jitter", state: "open", authorLogin: "demo-dev", authorAvatarUrl: null, additions: 189, deletions: 21, changedFiles: 6, unresolvedThreads: 0, mergeableState: "clean", reviewDecision: "approved" },
  "demo-billing#88": { title: "Use the customer region for the tax total on invoice PDFs", state: "open", authorLogin: "demo-dev", authorAvatarUrl: null, additions: 47, deletions: 12, changedFiles: 3, unresolvedThreads: 5, mergeableState: "dirty", reviewDecision: "changes_requested" },
  "demo-auth#301": { title: "Keep the session after a password reset", state: "draft", authorLogin: "demo-dev", authorAvatarUrl: null, additions: 23, deletions: 4, changedFiles: 2, unresolvedThreads: 0, mergeableState: "unknown", reviewDecision: "none" },
  "demo-admin-ui#940": { title: "Filter the audit log by actor, action and date range", state: "open", authorLogin: "demo-dev", authorAvatarUrl: null, additions: 1204, deletions: 377, changedFiles: 31, unresolvedThreads: 1, mergeableState: "clean", reviewDecision: "approved" },
  "demo-notify#57": { title: "Store reminder times in UTC and convert at send time", state: "merged", authorLogin: "demo-dev", authorAvatarUrl: null, additions: 66, deletions: 30, changedFiles: 4, unresolvedThreads: 0, mergeableState: "clean", reviewDecision: "approved" },
};

/** The preview response for a demo ref, or null if the ref is not demo data. */
export function demoPreview(ref: string) {
  const jira = DEMO_JIRA[ref];
  if (jira) return { ref, title: jira.title, issueType: jira.issueType };
  const pr = DEMO_PRS[ref];
  if (pr) {
    const [repo, num] = ref.split("#");
    const now = new Date().toISOString();
    const preview: GithubPrPreview = {
      title: pr.title,
      state: pr.state,
      owner: DEMO_OWNER,
      repo,
      number: Number(num),
      createdAt: now,
      updatedAt: now,
      authorLogin: pr.authorLogin,
      authorAvatarUrl: pr.authorAvatarUrl,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changedFiles,
      unresolvedThreads: pr.unresolvedThreads,
    };
    return { ref, title: pr.title, pr: preview };
  }
  return null;
}
