"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type EnrichedRowView } from "@/lib/client-api";
import { RefPill } from "./ref-pill";
import { DeferredSpinner } from "./deferred-spinner";
import { JiraStatusBadge } from "./status-badge";

/**
 * Compact, read-only card for the Board view (Dashboard v2).
 *
 * The LLM agent ticks sub-tasks through the API. The user owns only the two
 * terminal actions here: "Mark as done" and "Won't fix". Both go through the
 * same engine endpoints as the v1 RowCard.
 */

function fmtAge(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  if (ms < 0 || isNaN(ms)) return "just now";
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "just now";
}

export function BoardCard({ row }: { row: EnrichedRowView }) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["rows"] });
  const completeMut = useMutation({ mutationFn: () => api.completeRow(row.identityRef), onSettled: invalidate });
  const wontFixMut = useMutation({ mutationFn: () => api.wontFixRow(row.identityRef), onSettled: invalidate });
  const busy = completeMut.isPending || wontFixMut.isPending;

  const identityTone =
    row.pipelineKey === "support_light"
      ? "identity-support-light"
      : row.origin === "support"
        ? "identity-support"
        : "identity-product";

  const current = row.milestones.find((m) => m.isCurrent);
  const checked = current?.subtasks.filter((s) => s.checked).length ?? 0;
  const total = current?.subtasks.length ?? 0;
  const next = current?.subtasks.find((s) => !s.checked);
  const error = completeMut.error ?? wontFixMut.error;

  return (
    <div
      className={`rounded-[10px] border border-edge bg-surface p-3 shadow-card transition-opacity ${
        row.isComplete ? "opacity-70" : ""
      }`}
    >
      {/* Identity card + Jira status */}
      <div className="flex flex-wrap items-center gap-1.5">
        <RefPill
          refText={row.identityRef}
          url={row.identityResolvedUrl}
          tone={identityTone}
          jiraStatus={row.jiraStatus}
          statusBadge={
            row.jiraStatus ? (
              <JiraStatusBadge statusName={row.jiraStatus.statusName} statusCategory={row.jiraStatus.statusCategory} />
            ) : undefined
          }
        />
      </div>

      {/* Secondary pills (PRs, dupe cards) */}
      {row.secondaryRefs.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {row.secondaryRefs.map((r) => (
            <RefPill key={r.ref} refText={r.ref} url={r.resolvedUrl} tone="secondary" />
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2 text-[10.5px] font-mono text-ink-faint">
        <span className="truncate">
          {row.pipelineLabel}
          {row.subType ? ` · ${row.subType}` : ""}
        </span>
        <span title={`Card age: ${fmtAge(row.createdAt)}`} className="shrink-0">
          {current ? `${fmtAge(current.updatedAt || current.createdAt)} in stage` : `age ${fmtAge(row.createdAt)}`}
        </span>
      </div>

      {/* Progress inside the current milestone */}
      {current && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10.5px] text-ink-muted">
            <span className="font-serif italic text-accent">{current.label}</span>
            <span className="font-mono">
              {checked}/{total}
            </span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${total ? (checked / total) * 100 : 0}%` }}
            />
          </div>
          {next && (
            <div className="mt-1.5 truncate text-[11px] text-ink-muted" title={next.label}>
              <span className="font-mono text-[10px] text-ink-faint">Next: </span>
              {next.label}
              {next.humanUsual && (
                <span className="ml-1 rounded-full border border-warn/50 px-1.5 text-[9.5px] text-warn">you</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Done-section status */}
      {row.isComplete && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`font-serif text-xs italic ${row.hasLooseEnds ? "text-warn" : "text-done"}`}>
            {row.hasLooseEnds ? "won't fix / loose ends" : "✓ complete"}
          </span>
        </div>
      )}

      {/* The two user-owned actions */}
      {!row.isComplete && (
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-edge/60 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => wontFixMut.mutate()}
            className="flex-1 rounded-[6px] border border-edge bg-surface-2 px-2 py-1 text-[11px] font-semibold text-ink-muted hover:border-warn hover:bg-warn/10 hover:text-warn disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer transition-colors"
            title="Mark row as Won't Fix and move it to Done"
          >
            <DeferredSpinner isPending={wontFixMut.isPending} className="h-3 w-3 text-current" />
            Won&apos;t fix
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => completeMut.mutate()}
            className="flex-1 rounded-[6px] border border-done/40 bg-done/10 px-2 py-1 text-[11px] font-semibold text-done hover:bg-done hover:text-accent-ink disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer transition-colors"
            title="Tick all remaining milestones & sub-tasks and complete row"
          >
            <DeferredSpinner isPending={completeMut.isPending} className="h-3 w-3 text-current" />
            Mark as done
          </button>
        </div>
      )}
      {error && <p className="mt-1.5 text-[10.5px] text-danger">{error.message}</p>}
    </div>
  );
}
