"use client";

import { useState, Fragment, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type EnrichedRowView } from "@/lib/client-api";
import { inRange, type InspectRange } from "@/lib/inspect";
import { RefPill } from "./ref-pill";
import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { Spinner } from "./spinner";
import { DeferredSpinner } from "./deferred-spinner";

function SubtaskCheckbox({
  checked,
  disabled,
  onChange,
  isPending,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  isPending: boolean;
}) {
  const showSpinner = useDeferredLoading(isPending);

  if (showSpinner) {
    return (
      <span className="mt-0.5 flex h-[13px] w-[13px] items-center justify-center">
        <Spinner className="h-3 w-3 text-done" />
      </span>
    );
  }

  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled || isPending}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-px accent-done cursor-pointer disabled:cursor-not-allowed"
    />
  );
}

function MilestoneCircle({
  complete,
  isCurrent,
  disabled,
  onCheckAll,
  onRegress,
  isPending,
}: {
  complete: boolean;
  isCurrent: boolean;
  disabled: boolean;
  onCheckAll: () => void;
  onRegress: () => void;
  isPending: boolean;
}) {
  const showSpinner = useDeferredLoading(isPending);
  const nodeColor = complete ? "text-done" : isCurrent ? "text-accent" : "text-ink-faint";

  if (showSpinner) {
    return (
      <span className="flex h-[13px] w-[13px] items-center justify-center">
        <Spinner className={`h-3 w-3 ${nodeColor}`} />
      </span>
    );
  }

  return (
    <input
      type="checkbox"
      checked={complete}
      disabled={disabled}
      onChange={() => (complete ? onRegress() : onCheckAll())}
      title={
        complete
          ? "Click to regress this milestone"
          : "Click to tick all sub-tasks in this milestone"
      }
      className={`h-[13px] w-[13px] ${
        complete ? "accent-done" : ""
      } ${!disabled ? "cursor-pointer" : "cursor-default"}`}
    />
  );
}

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
  const checkAllMut = useMutation({
    mutationFn: (v: { milestone: string; checked: boolean }) =>
      api.checkAllSubtasks(row.identityRef, v.milestone, v.checked),
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

  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftShadow(el.scrollLeft > 0);
    setShowRightShadow(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    if (open) {
      const el = scrollRef.current;
      if (el) {
        handleScroll();
        el.addEventListener("scroll", handleScroll);
        window.addEventListener("resize", handleScroll);
        return () => {
          el.removeEventListener("scroll", handleScroll);
          window.removeEventListener("resize", handleScroll);
        };
      }
    }
  }, [open]);

  const doneCount = row.milestones.filter((m) => m.complete).length;
  const isSupportLight = row.pipelineKey === "support_light";
  const identityTone = isSupportLight
    ? "identity-support-light"
    : row.origin === "support"
      ? "identity-support"
      : "identity-product";
  const current = row.milestones.find((m) => m.isCurrent);


  return (
    <div
      className={`rounded-xl border border-edge bg-surface shadow-card transition-opacity ${
        row.isComplete && !row.hasLooseEnds ? "opacity-55" : ""
      }`}
    >
      {/* Collapsed line */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3.5 px-4 py-[13px] text-left cursor-pointer"
      >


        <span className="flex min-w-0 shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <RefPill refText={row.identityRef} url={row.identityResolvedUrl} tone={identityTone} />
          <span className="hidden sm:inline-flex items-center gap-1.5">
            {row.secondaryRefs.map((r) => (
              <RefPill key={r.ref} refText={r.ref} url={r.resolvedUrl} tone="secondary" />
            ))}
          </span>
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
                  {m.complete || m.isCurrent ? "●" : "○"}
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
          className={`hidden sm:inline-block w-[150px] shrink-0 truncate text-right font-serif text-sm italic ${
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
        <div className="border-t border-edge p-4 relative">
          <div className="relative">
            {/* Left shadow fade */}
            <div
              className={`absolute left-0 top-0 bottom-1.5 w-8 bg-gradient-to-r from-surface to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
                showLeftShadow ? "opacity-100" : "opacity-0"
              }`}
            />
            {/* Right shadow fade */}
            <div
              className={`absolute right-0 top-0 bottom-1.5 w-8 bg-gradient-to-l from-surface to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
                showRightShadow ? "opacity-100" : "opacity-0"
              }`}
            />

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="grid gap-3 overflow-x-auto pb-1.5"
              style={{ gridTemplateColumns: `repeat(${row.milestones.length}, minmax(180px, 1fr))` }}
            >
              {row.milestones.map((m) => {
                const grayed = inspect && !inRange(m.updatedAt, inspect);
                const nodeColor = m.complete ? "text-done" : m.isCurrent ? "text-accent" : "text-ink-faint";
                return (
                  <div
                    key={m.key}
                    className={`rounded-[9px] border bg-surface-2 px-3 py-[11px] transition-colors ${
                      m.isCurrent
                        ? "border-accent ring-1 ring-accent/20"
                        : "border-edge"
                    } ${grayed ? "opacity-30" : ""}`}
                  >
                    <div className="mb-2 flex items-center gap-[7px] border-b border-edge pb-2">
                      <MilestoneCircle
                        complete={m.complete}
                        isCurrent={m.isCurrent}
                        disabled={
                          readOnly ||
                          subtaskMut.isPending ||
                          checkAllMut.isPending ||
                          regressMut.isPending
                        }
                        isPending={
                          (regressMut.isPending && regressMut.variables === m.key) ||
                          (checkAllMut.isPending && checkAllMut.variables?.milestone === m.key) ||
                          (subtaskMut.isPending && subtaskMut.variables?.milestone === m.key)
                        }
                        onCheckAll={() => {
                          checkAllMut.mutate({ milestone: m.key, checked: true });
                        }}
                        onRegress={() => {
                          if (
                            window.confirm(
                              `Regress to "${m.label}"? This clears all sub-tasks of this milestone and every milestone after it.`,
                            )
                          ) {
                            regressMut.mutate(m.key);
                          }
                        }}
                      />
                      <span
                        className={`truncate text-xs font-semibold ${
                          m.complete ? "text-done" : m.isCurrent ? "text-accent" : "text-ink-muted"
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
                              className={`flex items-start gap-[7px] text-xs ${
                                readOnly || subtaskMut.isPending ? "cursor-not-allowed" : "cursor-pointer"
                              } ${s.checked ? "text-ink-muted" : "text-ink"}`}
                              title={`Updated ${fmt(s.updatedAt)}${s.humanUsual ? " · usually done by you" : ""}`}
                            >
                              <SubtaskCheckbox
                                checked={s.checked}
                                disabled={readOnly || subtaskMut.isPending}
                                onChange={(checked) =>
                                  subtaskMut.mutate({ milestone: m.key, subtask: s.key, checked })
                                }
                                isPending={
                                  subtaskMut.isPending &&
                                  subtaskMut.variables?.milestone === m.key &&
                                  subtaskMut.variables?.subtask === s.key
                                }
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
          </div>

          {/* Row actions */}
          {!readOnly && (
            <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newRef.trim()) return;
                  refsMut.mutate({ action: "add", ref: newRef.trim() });
                  setNewRef("");
                }}
                className="flex items-center gap-1.5 w-full sm:w-auto"
              >
                <input
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  placeholder="Add ref (PES-123, repo#45)"
                  className="flex-1 min-w-0 sm:w-[200px] rounded-[7px] border border-edge bg-surface-2 px-2.5 py-1.5 font-mono text-[11.5px] outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={refsMut.isPending}
                  className="rounded-[7px] border border-edge px-3 py-1.5 text-[11.5px] text-ink-muted hover:border-edge-strong disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <DeferredSpinner isPending={refsMut.isPending && refsMut.variables?.action === "add"} className="h-3 w-3 text-current" />
                  + ref
                </button>
              </form>
              {row.secondaryRefs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {row.secondaryRefs.map((r) => {
                    const isRemoving = refsMut.isPending && refsMut.variables?.action === "remove" && refsMut.variables?.ref === r.ref;
                    return (
                      <RefPill
                        key={r.ref}
                        refText={r.ref}
                        url={r.resolvedUrl}
                        tone="secondary"
                        onRemove={() => refsMut.mutate({ action: "remove", ref: r.ref })}
                        isRemoving={isRemoving}
                      />
                    );
                  })}
                </div>
              )}
              <button
                disabled={deleteMut.isPending}
                onClick={() => {
                  if (window.confirm(`Delete the row for ${row.identityRef}? This cannot be undone.`)) {
                    deleteMut.mutate();
                  }
                }}
                className="w-full sm:w-auto sm:ml-auto rounded-[7px] border border-edge px-3 py-1.5 text-[11.5px] text-ink-faint hover:border-danger hover:text-danger disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <DeferredSpinner isPending={deleteMut.isPending} className="h-3 w-3 text-current" />
                Delete row
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
