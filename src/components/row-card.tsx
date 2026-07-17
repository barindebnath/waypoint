"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type EnrichedRowView } from "@/lib/client-api";
import { inRange, type InspectRange } from "@/lib/inspect";
import { RefPill } from "./ref-pill";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RowCard({
  row,
  readOnly,
  inspect,
}: {
  row: EnrichedRowView;
  readOnly: boolean;
  inspect: InspectRange | null;
}) {
  const [open, setOpen] = useState(false);
  const [newRef, setNewRef] = useState("");
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["rows"] });

  const subtaskMut = useMutation({
    mutationFn: (v: { milestone: string; subtask: string; checked: boolean }) =>
      api.setSubtask(row.identityRef, v.milestone, v.subtask, v.checked),
    onSettled: invalidate,
  });
  const regressMut = useMutation({
    mutationFn: (milestone: string) => api.regress(row.identityRef, milestone),
    onSettled: invalidate,
  });
  const refsMut = useMutation({
    mutationFn: (v: { action: "add" | "remove"; ref: string }) =>
      api.updateRefs(row.identityRef, v.action, { ref: v.ref }),
    onSettled: invalidate,
  });
  const deleteMut = useMutation({ mutationFn: () => api.deleteRow(row.identityRef), onSettled: invalidate });

  const doneCount = row.milestones.filter((m) => m.complete).length;
  const identityTone = row.origin === "support" ? "identity-support" : "identity-product";

  return (
    <div
      className={`rounded-lg border border-edge bg-surface transition-colors ${
        row.isComplete && !row.hasLooseEnds ? "opacity-60" : ""
      }`}
    >
      {/* Collapsed line */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-2/50"
      >
        <span
          className={`w-24 shrink-0 truncate text-[10px] uppercase tracking-wider ${
            row.origin === "support" ? "text-support" : "text-product"
          }`}
          title={`${row.pipelineLabel}${row.subType ? ` · ${row.subType}` : ""}`}
        >
          {row.pipelineLabel}
          {row.subType ? ` · ${row.subType}` : ""}
        </span>

        <span className="flex min-w-0 shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <RefPill refText={row.identityRef} url={row.identityResolvedUrl} tone={identityTone} />
          {row.secondaryRefs.map((r) => (
            <RefPill key={r.ref} refText={r.ref} url={r.resolvedUrl} tone="secondary" />
          ))}
        </span>

        {/* Milestone bar */}
        <span className="flex h-2.5 flex-1 items-center gap-0.5" aria-label={`${doneCount}/${row.milestones.length} milestones`}>
          {row.milestones.map((m) => {
            const grayed = inspect && !inRange(m.updatedAt, inspect);
            return (
              <span
                key={m.key}
                title={`${m.label} — ${m.complete ? "complete" : m.isCurrent ? "current" : "pending"} · ${fmt(m.updatedAt)}`}
                className={`h-full flex-1 rounded-sm ${
                  m.complete ? "bg-done" : m.isCurrent ? "bg-live/40 animate-live" : "bg-surface-3"
                } ${grayed ? "opacity-25" : ""}`}
              />
            );
          })}
        </span>

        <span className="w-40 shrink-0 truncate text-right text-xs text-ink-muted">
          {row.isComplete ? (
            <span className="text-done">✓ complete</span>
          ) : (
            row.milestones.find((m) => m.isCurrent)?.label
          )}
        </span>
        {row.hasLooseEnds && (
          <span
            className="shrink-0 rounded-full border border-warn/50 px-1.5 py-0.5 text-[10px] text-warn"
            title="Complete, but has unchecked sub-tasks"
          >
            loose ends
          </span>
        )}
        <span className={`shrink-0 text-ink-faint transition-transform ${open ? "rotate-90" : ""}`}>›</span>
      </button>

      {/* Expanded milestones */}
      {open && (
        <div className="border-t border-edge px-3 py-3">
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${row.milestones.length}, minmax(0, 1fr))` }}>
            {row.milestones.map((m) => {
              const grayed = inspect && !inRange(m.updatedAt, inspect);
              return (
                <div key={m.key} className={`rounded border border-edge bg-surface-2/60 p-2 ${grayed ? "opacity-30" : ""}`}>
                  <div className="mb-2 flex items-center gap-1.5 border-b border-edge pb-1.5">
                    <input
                      type="checkbox"
                      checked={m.complete}
                      disabled={readOnly || !m.complete}
                      title={
                        m.complete
                          ? "Uncheck to regress: clears this milestone and everything after it"
                          : "Completes automatically when all sub-tasks are checked"
                      }
                      onChange={() => {
                        if (!m.complete) return;
                        if (
                          window.confirm(
                            `Regress to "${m.label}"? This clears all sub-tasks of this milestone and every milestone after it.`,
                          )
                        ) {
                          regressMut.mutate(m.key);
                        }
                      }}
                      className="accent-done"
                    />
                    <span
                      className={`truncate text-xs font-medium ${m.isCurrent ? "text-live" : m.complete ? "text-done" : "text-ink-muted"}`}
                      title={`Updated ${fmt(m.updatedAt)}`}
                    >
                      {m.label}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {m.subtasks.map((s) => {
                      const sGrayed = inspect && !inRange(s.updatedAt, inspect);
                      return (
                        <li key={s.key} className={sGrayed ? "opacity-30" : ""}>
                          <label
                            className={`flex cursor-pointer items-start gap-1.5 text-xs ${s.checked ? "text-ink-muted" : "text-ink"}`}
                            title={`Updated ${fmt(s.updatedAt)}${s.humanUsual ? " · usually done by you" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={s.checked}
                              disabled={readOnly || subtaskMut.isPending}
                              onChange={(e) =>
                                subtaskMut.mutate({ milestone: m.key, subtask: s.key, checked: e.target.checked })
                              }
                              className="mt-0.5 accent-done"
                            />
                            <span className={s.checked ? "line-through decoration-ink-faint" : ""}>
                              {s.label}
                              {s.humanUsual && <span className="ml-1 rounded bg-surface-3 px-1 text-[9px] text-ink-faint" title="Usually done by you, not the AI">you</span>}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Row actions */}
          {!readOnly && (
            <div className="mt-3 flex items-center gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newRef.trim()) return;
                  refsMut.mutate({ action: "add", ref: newRef.trim() });
                  setNewRef("");
                }}
                className="flex items-center gap-1"
              >
                <input
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  placeholder="Add ref (PES-123, repo#45)"
                  className="w-52 rounded border border-edge bg-surface-2 px-2 py-1 font-mono text-xs outline-none focus:border-live"
                />
                <button type="submit" className="rounded border border-edge px-2 py-1 text-xs text-ink-muted hover:bg-surface-2">
                  + ref
                </button>
              </form>
              {row.secondaryRefs.length > 0 && (
                <span className="flex items-center gap-1.5">
                  {row.secondaryRefs.map((r) => (
                    <RefPill
                      key={r.ref}
                      refText={r.ref}
                      url={r.resolvedUrl}
                      tone="secondary"
                      onRemove={() => refsMut.mutate({ action: "remove", ref: r.ref })}
                    />
                  ))}
                </span>
              )}
              <button
                onClick={() => {
                  if (window.confirm(`Delete the row for ${row.identityRef}? This cannot be undone.`)) {
                    deleteMut.mutate();
                  }
                }}
                className="ml-auto rounded border border-edge px-2 py-1 text-xs text-ink-faint hover:border-danger/50 hover:text-danger"
              >
                Delete row
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
