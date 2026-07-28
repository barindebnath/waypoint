import React from "react";

export interface GithubPrBadgeProps {
  state: "open" | "closed" | "merged" | "draft" | string;
  mergeableState: "clean" | "dirty" | "blocked" | "unknown" | string;
  reviewDecision: "approved" | "changes_requested" | "review_required" | "none" | string;
}

export function GitPullRequestIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <line x1="6" y1="9" x2="6" y2="21" />
    </svg>
  );
}

export function RefreshIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

export function FilterIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

export function PlusIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

export function GithubPrBadge({ state, mergeableState, reviewDecision }: GithubPrBadgeProps) {
  if (state === "merged") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-semibold rounded-full border border-purple-800/40 bg-purple-500/10 text-purple-400">
        Merged
      </span>
    );
  }
  if (state === "draft") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-medium rounded-full border border-edge bg-surface text-ink-faint">
        Draft
      </span>
    );
  }
  if (mergeableState === "dirty") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-semibold rounded-full border border-warn/40 bg-warn/10 text-warn animate-pulse">
        ⚠️ Conflicts
      </span>
    );
  }
  if (reviewDecision === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-semibold rounded-full border border-done/40 bg-done/10 text-done">
        Approved
      </span>
    );
  }
  if (reviewDecision === "changes_requested") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-semibold rounded-full border border-danger/40 bg-danger/10 text-danger">
        Changes Requested
      </span>
    );
  }
  if (state === "closed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-semibold rounded-full border border-danger/40 bg-danger/10 text-danger">
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-semibold rounded-full border border-done/40 bg-done/10 text-done">
      Open
    </span>
  );
}

export interface JiraStatusBadgeProps {
  statusName: string;
  statusCategory: "todo" | "inprogress" | "done" | string;
}

export function JiraStatusBadge({ statusName, statusCategory }: JiraStatusBadgeProps) {
  const lower = statusName.toLowerCase();
  if (statusCategory === "done") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-semibold rounded-full border border-done/40 bg-done/10 text-done">
        {statusName}
      </span>
    );
  }
  if (lower.includes("review") || lower.includes("qa")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-semibold rounded-full border border-warn/40 bg-warn/10 text-warn">
        {statusName}
      </span>
    );
  }
  if (statusCategory === "inprogress" || lower.includes("progress")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-semibold rounded-full border border-accent/40 bg-accent/10 text-accent">
        {statusName}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-medium rounded-full border border-edge bg-surface text-ink-faint">
      {statusName}
    </span>
  );
}
