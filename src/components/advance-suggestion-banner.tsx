"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type EnrichedRowView } from "@/lib/client-api";
import { DeferredSpinner } from "./deferred-spinner";

export interface AdvanceSuggestion {
  id: string;
  rowId: string;
  identityRef: string;
  title: string;
  message: string;
  actionType: "complete" | "subtask";
  milestone?: string;
  subtask?: string;
}

export function AdvanceSuggestionBanner({
  rows,
  readOnly,
}: {
  rows: EnrichedRowView[];
  readOnly: boolean;
}) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["rows"] });

  const completeMut = useMutation({
    mutationFn: (ref: string) => api.completeRow(ref),
    onSettled: invalidate,
  });

  const subtaskMut = useMutation({
    mutationFn: ({ ref, milestone, subtask }: { ref: string; milestone: string; subtask: string }) =>
      api.setSubtask(ref, milestone, subtask, true),
    onSettled: invalidate,
  });

  if (readOnly) return null;

  const suggestions: AdvanceSuggestion[] = [];

  for (const row of rows) {
    if (row.isComplete) continue;

    const prRef = row.secondaryRefs.find((r) => r.kind === "github_pr");

    // Check PR merged state
    if (prRef?.prStatus?.state === "merged") {
      const prodMilestone = row.milestones.find((m) => m.key === "prod_close" || m.key === "closeout");
      const isProdDone = prodMilestone?.complete;
      if (!isProdDone) {
        suggestions.push({
          id: `${row.id}-pr-merged`,
          rowId: row.id,
          identityRef: row.identityRef,
          title: "PR Merged",
          message: `PR ${prRef.ref} was merged on GitHub. Mark "${row.identityRef}" as complete?`,
          actionType: "complete",
        });
        continue;
      }
    }

    // Check PR approved state
    if (prRef?.prStatus?.reviewDecision === "approved") {
      const qaMilestone = row.milestones.find((m) => m.key === "qa_review");
      const reviewSubtask = qaMilestone?.subtasks.find((s) => s.key === "pr_reviewed");
      if (qaMilestone && reviewSubtask && !reviewSubtask.checked) {
        suggestions.push({
          id: `${row.id}-pr-approved`,
          rowId: row.id,
          identityRef: row.identityRef,
          title: "PR Approved",
          message: `GitHub PR ${prRef.ref} is approved. Tick "PR Reviewed" for "${row.identityRef}"?`,
          actionType: "subtask",
          milestone: "qa_review",
          subtask: "pr_reviewed",
        });
        continue;
      }
    }

    // Check Jira status category done
    if (row.jiraStatus?.statusCategory === "done" && !row.isComplete) {
      suggestions.push({
        id: `${row.id}-jira-done`,
        rowId: row.id,
        identityRef: row.identityRef,
        title: "Jira Card Done",
        message: `Jira status is "${row.jiraStatus.statusName}". Mark "${row.identityRef}" as complete?`,
        actionType: "complete",
      });
      continue;
    }
  }

  const activeSuggestions = suggestions.filter((s) => !dismissedIds.includes(s.id));

  if (activeSuggestions.length === 0) return null;

  // Render first 2 most critical suggestions to avoid clutter
  const displayed = activeSuggestions.slice(0, 2);

  return (
    <div className="mb-3.5 flex flex-col gap-2 animate-fade-in">
      {displayed.map((item) => {
        const isExecuting =
          (completeMut.isPending && completeMut.variables === item.identityRef) ||
          (subtaskMut.isPending && subtaskMut.variables?.ref === item.identityRef);

        return (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-accent/40 bg-accent/10 p-3 text-xs text-ink shadow-sm transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink font-bold text-[11px]">
                ⚡
              </span>
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <span className="font-mono font-semibold text-accent uppercase text-[10.5px] tracking-wide">
                  [{item.title}]
                </span>
                <span className="text-ink truncate font-medium">{item.message}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                disabled={isExecuting}
                onClick={async () => {
                  if (item.actionType === "complete") {
                    await completeMut.mutateAsync(item.identityRef);
                  } else if (item.actionType === "subtask" && item.milestone && item.subtask) {
                    await subtaskMut.mutateAsync({
                      ref: item.identityRef,
                      milestone: item.milestone,
                      subtask: item.subtask,
                    });
                  }
                  setDismissedIds((prev) => [...prev, item.id]);
                }}
                className="flex items-center gap-1.5 rounded-[7px] bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <DeferredSpinner isPending={isExecuting} className="h-3 w-3 text-current" />
                <span>Advance ✓</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissedIds((prev) => [...prev, item.id])}
                className="rounded-[7px] border border-edge bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink hover:border-edge-strong cursor-pointer"
                title="Dismiss suggestion"
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
