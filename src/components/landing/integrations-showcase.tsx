"use client";

import { useState } from "react";
import { Chip } from "@/components/chip";
import { BoltIcon } from "@/components/icons";
import { GithubPrBadge, JiraStatusBadge } from "@/components/status-badge";
import { btnPill } from "@/components/ui";
import { GitPullRequestIcon, RefreshIcon } from "./icons";

type PrState = "open" | "merged" | "draft" | "approved";

type SyncItem = {
  id: string;
  ref: string;
  jiraStatus: string;
  jiraCategory: "todo" | "inprogress" | "done";
  prRef: string;
  prState: PrState;
  prChecks: "passing" | "pending";
  activeMilestone: string;
  lastSynced: string;
};

/** The props of the real PR badge for each sample state, so the sample looks like the Board. */
const PR_BADGE = {
  approved: { state: "open", mergeableState: "clean", reviewDecision: "approved" },
  open: { state: "open", mergeableState: "clean", reviewDecision: "review_required" },
  draft: { state: "draft", mergeableState: "unknown", reviewDecision: "none" },
  merged: { state: "merged", mergeableState: "clean", reviewDecision: "approved" },
} as const satisfies Record<PrState, { state: string; mergeableState: string; reviewDecision: string }>;

const INITIAL_SYNC_ITEMS: SyncItem[] = [
  {
    id: "1",
    ref: "ZT-4821",
    jiraStatus: "In Staging",
    jiraCategory: "inprogress",
    prRef: "web-client#142",
    prState: "approved",
    prChecks: "passing",
    activeMilestone: "Staging (1/2)",
    lastSynced: "Just now",
  },
  {
    id: "2",
    ref: "PES-1090",
    jiraStatus: "In Review",
    jiraCategory: "inprogress",
    prRef: "api-service#89",
    prState: "open",
    prChecks: "passing",
    activeMilestone: "QA & Review (1/2)",
    lastSynced: "2m ago",
  },
  {
    id: "3",
    ref: "OFF-3490",
    jiraStatus: "In Progress",
    jiraCategory: "inprogress",
    prRef: "mobile-app#312",
    prState: "draft",
    prChecks: "pending",
    activeMilestone: "Development (1/2)",
    lastSynced: "5m ago",
  },
];

export function IntegrationsShowcase() {
  const [items, setItems] = useState<SyncItem[]>(INITIAL_SYNC_ITEMS);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          lastSynced: "Just now",
        }))
      );
      setIsSyncing(false);
    }, 700);
  };

  return (
    <div className="w-full space-y-3 rounded-3xl bg-surface p-4 sm:p-6">
      {/* Header with Sync Trigger */}
      <div className="flex flex-col justify-between gap-3 pb-1 sm:flex-row sm:items-start">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-accent-fg">
            <GitPullRequestIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="font-serif text-lg font-semibold tracking-tight text-ink">
                Bi-Directional Awareness (Jira &amp; GitHub)
              </h3>
              <Chip tone="mint">Live Sync</Chip>
            </div>
            <p className="mt-1 text-[13px] text-ink-muted">
              Auto-ticks matching milestones as PRs merge and Jira tickets advance.
            </p>
          </div>
        </div>

        <button type="button" onClick={handleTriggerSync} disabled={isSyncing} className={`${btnPill} self-start`}>
          <RefreshIcon className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-accent-fg" : ""}`} />
          <span>{isSyncing ? "Syncing..." : "Simulate Sync"}</span>
        </button>
      </div>

      {/* Sync Items List */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between gap-3 rounded-2xl bg-surface-2 p-4 md:flex-row md:items-center"
          >
            {/* Left: Jira Card & Jira status */}
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[12.5px] font-semibold text-ink">{item.ref}</span>
              <JiraStatusBadge statusName={item.jiraStatus} statusCategory={item.jiraCategory} />
            </div>

            {/* Middle: GitHub PR details */}
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="ghost" className="font-mono" icon={<GitPullRequestIcon className="h-3.5 w-3.5 text-accent-fg" />}>
                {item.prRef}
              </Chip>

              <GithubPrBadge {...PR_BADGE[item.prState]} />

              {item.prChecks === "passing" ? (
                <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-done">
                  <span className="h-1.5 w-1.5 rounded-full bg-done" />
                  <span>CI Passed</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-warn">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warn" />
                  <span>CI Running</span>
                </span>
              )}
            </div>

            {/* Right: Waypoint milestone state */}
            <div className="border-t border-edge/60 pt-2.5 text-left md:border-t-0 md:pt-0 md:text-right">
              <div className="text-[13px] font-semibold text-ink">{item.activeMilestone}</div>
              <div className="mt-0.5 text-[11px] text-ink-faint">Synced {item.lastSynced}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Fan-out explanation */}
      <div className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4 text-[12.5px] leading-relaxed text-ink-muted">
        <BoltIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-fg" />
        <p>
          <strong className="font-semibold text-ink">Fan-out sync:</strong>{" "}
          <code className="rounded-md bg-surface-3 px-1.5 py-0.5 font-mono text-[11.5px] text-ink">POST /api/v1/integrations/sync</code>{" "}
          reads all active cards concurrently and advances corresponding milestones without polling bottlenecks.
        </p>
      </div>
    </div>
  );
}
