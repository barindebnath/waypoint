"use client";

import { useState } from "react";
import { GitPullRequestIcon, RefreshIcon, CheckCircleIcon } from "./icons";

type SyncItem = {
  id: string;
  ref: string;
  jiraStatus: string;
  jiraStatusClass: string;
  prRef: string;
  prState: "open" | "merged" | "draft" | "approved";
  prChecks: "passing" | "pending" | "failing";
  activeMilestone: string;
  lastSynced: string;
};

const INITIAL_SYNC_ITEMS: SyncItem[] = [
  {
    id: "1",
    ref: "ZT-4821",
    jiraStatus: "IN STAGING",
    jiraStatusClass: "border-accent/40 bg-accent-soft text-accent",
    prRef: "web-client#142",
    prState: "approved",
    prChecks: "passing",
    activeMilestone: "Staging (1/2)",
    lastSynced: "Just now",
  },
  {
    id: "2",
    ref: "PES-1090",
    jiraStatus: "IN REVIEW",
    jiraStatusClass: "border-purple-400/40 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    prRef: "api-service#89",
    prState: "open",
    prChecks: "passing",
    activeMilestone: "QA & Review (1/2)",
    lastSynced: "2m ago",
  },
  {
    id: "3",
    ref: "OFF-3490",
    jiraStatus: "IN PROGRESS",
    jiraStatusClass: "border-blue-400/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
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
    }, 900);
  };

  return (
    <div className="w-full rounded-2xl border border-edge bg-surface p-5 sm:p-7 shadow-card">
      {/* Header with Sync Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-edge pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-base font-semibold text-ink">
              Bi-Directional Awareness (Jira & GitHub)
            </span>
            <span className="rounded-full bg-done-soft text-done px-2 py-0.5 font-mono text-[10.5px] font-semibold">
              Live Sync
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Waypoint reads external PR and issue states to advance milestones automatically.
          </p>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-edge-strong cursor-pointer disabled:opacity-50"
        >
          <RefreshIcon className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-accent" : "text-ink-muted"}`} />
          <span>{isSyncing ? "Syncing..." : "Simulate Sync"}</span>
        </button>
      </div>

      {/* Sync Table / Cards */}
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-edge bg-surface-2 p-3.5 sm:p-4 hover:border-edge-strong transition"
          >
            {/* Identity & Jira status */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-ink bg-surface px-2.5 py-1 rounded-md border border-edge">
                {item.ref}
              </span>
              <span className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium ${item.jiraStatusClass}`}>
                {item.jiraStatus}
              </span>
            </div>

            {/* GitHub PR status */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="flex items-center gap-1 rounded-full border border-edge bg-surface px-2.5 py-0.5 text-ink-muted">
                <GitPullRequestIcon className="h-3 w-3 text-accent" />
                <span>{item.prRef}</span>
              </span>

              {item.prState === "approved" && (
                <span className="rounded-full bg-done-soft px-2 py-0.5 text-[11px] font-semibold text-done">
                  Approved
                </span>
              )}
              {item.prState === "open" && (
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                  Open
                </span>
              )}
              {item.prState === "draft" && (
                <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-ink-faint">
                  Draft
                </span>
              )}

              {item.prChecks === "passing" ? (
                <span className="flex items-center gap-1 text-[11px] text-done" title="CI Checks Passing">
                  <span className="h-1.5 w-1.5 rounded-full bg-done" />
                  <span>CI Passed</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-ink-faint" title="CI Checks Running">
                  <span className="h-1.5 w-1.5 rounded-full bg-warn animate-pulse" />
                  <span>CI Running</span>
                </span>
              )}
            </div>

            {/* Waypoint auto-advancement state */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
              <div className="text-left sm:text-right">
                <div className="font-serif text-xs font-semibold text-ink">{item.activeMilestone}</div>
                <div className="text-[10.5px] text-ink-faint">Synced {item.lastSynced}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fan-Out Sync Banner */}
      <div className="mt-5 rounded-xl border border-edge bg-surface-3/30 p-3.5 text-xs text-ink-muted flex items-center justify-between">
        <span>⚡ <strong>Background Fan-Out:</strong> <code>POST /api/v1/integrations/sync</code> updates all active cards in parallel without manual polling.</span>
      </div>
    </div>
  );
}
