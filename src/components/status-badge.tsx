import React from "react";
import { Chip } from "./chip";
import { PlusIcon as PlusGlyph, PullRequestIcon, RefreshIcon as RefreshGlyph } from "./icons";

export interface GithubPrBadgeProps {
  state: "open" | "closed" | "merged" | "draft" | string;
  mergeableState: "clean" | "dirty" | "blocked" | "unknown" | string;
  reviewDecision: "approved" | "changes_requested" | "review_required" | "none" | string;
}

export function GitPullRequestIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return <PullRequestIcon className={className} />;
}

export function RefreshIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return <RefreshGlyph className={className} />;
}

export function PlusIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return <PlusGlyph className={className} />;
}

/** The state of a pull request, as a pastel pill. */
export function GithubPrBadge({ state, mergeableState, reviewDecision }: GithubPrBadgeProps) {
  if (state === "merged") return <Chip tone="lilac">Merged</Chip>;
  if (state === "draft") return <Chip tone="slate">Draft</Chip>;
  if (mergeableState === "dirty") return <Chip tone="orange" className="animate-pulse">Conflicts</Chip>;
  if (reviewDecision === "approved") return <Chip tone="mint">Approved</Chip>;
  if (reviewDecision === "changes_requested") return <Chip tone="salmon">Changes Requested</Chip>;
  if (state === "closed") return <Chip tone="red">Closed</Chip>;
  return <Chip tone="aqua">Open</Chip>;
}

export interface JiraStatusBadgeProps {
  statusName: string;
  statusCategory: "todo" | "inprogress" | "done" | string;
}

/** The Jira status of a card, as a pastel pill. The colour follows the Jira status category. */
export function JiraStatusBadge({ statusName, statusCategory }: JiraStatusBadgeProps) {
  const lower = statusName.toLowerCase();
  if (statusCategory === "done") return <Chip tone="mint">{statusName}</Chip>;
  if (lower.includes("review") || lower.includes("qa")) return <Chip tone="orange">{statusName}</Chip>;
  if (statusCategory === "inprogress" || lower.includes("progress")) return <Chip tone="sky">{statusName}</Chip>;
  return <Chip tone="slate">{statusName}</Chip>;
}
