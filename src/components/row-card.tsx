"use client";

import { useState, Fragment } from "react";
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
  const originColor = row.origin === "support" ? "text-support" : "text-product";
  const identityTone = row.origin === "support" ? "identity-support" : "identity-product";
  const current = row.milestones.find((m) => m.isCurrent);
  const plLabel = `${row.pipelineLabel}${row.subType ? ` · ${row.subType}` : ""}`;

  return (
    <div
      className={`rounded-xl border border-edge bg-surface shadow-card transition-opacity ${
        row.isComplete && !row.hasLooseEnds ? "opacity-55" : ""
      }`}
    >
      {/* Collapsed line */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3.5 px-4 py-[13px] text-left"
      >
        <span
          className={`w-[104px] shrink-0 truncate text-[10px] uppercase tracking-[0.13em] ${originColor}`}
          title={plLabel}
        >
          {plLabel}
        </span>

        <span className="flex min-w-0 shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <RefPill refText={row.identityRef} url={row.identityResolvedUrl} tone={identityTone} />
          {row.secondaryRefs.map((r) => (
            <RefPill key={r.ref} refText={r.ref} url={r.resolvedUrl} tone="secondary" />
          ))}
        </span>

        {/* Diamond milestone bar */}
        <span
          className="flex min-w-[120px] flex-1 items-center"
          aria-label={`${doneCount}/${row.milestones.length} milestones`}
        >
          {row.milestones.map((m, i) => {
            const grayed = inspect && !inRange(m.updatedAt, inspect);
            const nodeColor = m.complete ? "text-done" : m.isCurrent ? "text-accent" : "text-ink-faint";
            return (
              <Fragment key={m.key}>
                <span
                  title={`${m.label} — ${m.complete ? "complete" : m.isCurrent ? "current" : "pending"} · ${fmt(m.updatedAt)}`}
                  className={`text-[13px] leading-none ${nodeColor} ${m.isCurrent ? "animate-live" : ""} ${grayed ? "opacity-30" : ""}`}
                >
                  {m.complete || m.isCurrent ? "◆" : "◇"}
                </span>
                {i < row.milestones.length - 1 && (
                  <span
                    className={`mx-[3px] h-[1.5px] flex-1 ${m.complete ? "bg-done" : "bg-edge-strong"} ${grayed ? "opacity-30" : ""}`}
                  />
                )}
              </Fragment>
            );
          })}
        </span>

        <span
          className={`w-[150px] shrink-0 truncate text-right font-serif text-sm italic ${
            row.isComplete ? "text-done" : "text-accent"
          }`}
        >
          {row.isComplete ? "✓ complete" : current?.label}
        </span>
        {row.hasLooseEnds && (
          <span
            className="shrink-0 rounded-full border border-warn px-2 py-0.5 font-serif text-[10px] italic tracking-[0.06em] text-warn"
            title="Complete, but has unchecked sub-tasks"
          >
            loose ends
          </span>
        )}
        <span className={`shrink-0 text-[13px] text-ink-faint transition-transform ${open ? "rotate-90" : ""}`}>
          ›
        </span>
      </button>

      {/* Expanded milestones */}
      {open && (
        <div className="border-t border-edge p-4">
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${row.milestones.length}, minmax(0, 1fr))` }}
          >
            {row.milestones.map((m) => {
              const grayed = inspect && !inRange(m.updatedAt, inspect);
              const nodeColor = m.complete ? "text-done" : m.isCurrent ? "text-accent" : "text-ink-faint";
              return (
                <div
                  key={m.key}
                  className={`rounded-[9px] border border-edge bg-surface-2 px-3 py-[11px] ${grayed ? "opacity-30" : ""}`}
                >
                  <div className="mb-2 flex items-center gap-[7px] border-b border-edge pb-2">
                    <button
                      disabled={readOnly || !m.complete}
                      title={
                        m.complete
                          ? "Uncheck to regress: clears this milestone and everything after it"
                          : "Completes automatically when all sub-tasks are checked"
                      }
                      onClick={() => {
                        if (!m.complete) return;
                        if (
                          window.confirm(
                            `Regress to "${m.label}"? This clears all sub-tasks of this milestone and every milestone after it.`,
                          )
                        ) {
                          regressMut.mutate(m.key);
                        }
                      }}
                      className={`text-[13px] leading-none ${nodeColor} ${m.complete && !readOnly ? "cursor-pointer" : "cursor-default"}`}
                    >
                      {m.complete || m.isCurrent ? "◆" : "◇"}
                    </button>
                    <span
                      className={`truncate text-xs font-semibold ${
                        m.isCurrent ? "text-accent" : m.complete ? "text-done" : "text-ink-muted"
                      }`}
                      title={`${m.label} · updated ${fmt(m.updatedAt)}`}
                    >
                      {m.label}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-[7px]">
                    {m.subtasks.map((s) => {
                      const sGrayed = inspect && !inRange(s.updatedAt, inspect);
                      return (
                        <li key={s.key} className={sGrayed ? "opacity-30" : ""}>
                          <label
                            className={`flex cursor-pointer items-start gap-[7px] text-xs ${s.checked ? "text-ink-muted" : "text-ink"}`}
                            title={`Updated ${fmt(s.updatedAt)}${s.humanUsual ? " · usually done by you" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={s.checked}
                              disabled={readOnly || subtaskMut.isPending}
                              onChange={(e) =>
                                subtaskMut.mutate({ milestone: m.key, subtask: s.key, checked: e.target.checked })
                              }
                              className="mt-px accent-done"
                            />
                            <span className={s.checked ? "line-through" : ""}>
                              {s.label}
                              {s.humanUsual && (
                                <span
                                  className="ml-1 rounded border border-edge px-1 font-mono text-[9px] text-ink-faint"
                                  title="Usually done by you, not the AI"
                                >
                                  you
                                </span>
                              )}
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
            <div className="mt-3.5 flex items-center gap-2.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newRef.trim()) return;
                  refsMut.mutate({ action: "add", ref: newRef.trim() });
                  setNewRef("");
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  placeholder="Add ref (PES-123, repo#45)"
                  className="w-[200px] rounded-[7px] border border-edge bg-surface-2 px-2.5 py-1.5 font-mono text-[11.5px] outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="rounded-[7px] border border-edge px-3 py-1.5 text-[11.5px] text-ink-muted hover:border-edge-strong"
                >
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
                className="ml-auto rounded-[7px] border border-edge px-3 py-1.5 text-[11.5px] text-ink-faint hover:border-danger hover:text-danger"
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
