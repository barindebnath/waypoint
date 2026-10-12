"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type EnrichedRowView } from "@/lib/client-api";
import { RefPill } from "./ref-pill";
import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { Spinner } from "./spinner";
import { DeferredSpinner } from "./deferred-spinner";
import { parsePrRef } from "@/lib/github";
import { GitPullRequestIcon } from "./status-badge";
import { CloseIcon, PlusIcon, TrashIcon } from "./icons";
import { PrBlock } from "./pr-block";

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
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        <Spinner className="h-3.5 w-3.5 text-accent-fg" />
      </span>
    );
  }

  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled || isPending}
      onChange={(e) => onChange(e.target.checked)}
      className="wp-check"
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
  const nodeColor = complete ? "text-done" : isCurrent ? "text-accent-fg" : "text-ink-faint";

  if (showSpinner) {
    return (
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        <Spinner className={`h-3.5 w-3.5 ${nodeColor}`} />
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
      className="wp-check"
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

/** A small heading for a part of the modal. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">{children}</h3>;
}

/**
 * The milestones and their sub-tasks, in a grid of cards. The current milestone has the accent ring.
 * Each card shows a count of the ticked sub-tasks.
 */
export function RowProgress({ row }: { row: EnrichedRowView }) {
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

  const busy = subtaskMut.isPending || checkAllMut.isPending || regressMut.isPending;

  return (
    <section>
      <SectionTitle>Milestones</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {row.milestones.map((m) => {
          const doneCount = m.subtasks.filter((s) => s.checked).length;
          return (
            <div
              key={m.key}
              className={`rounded-card bg-surface p-4 ring-1 transition-colors ${
                m.isCurrent ? "ring-2 ring-accent/60" : "ring-edge"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MilestoneCircle
                  complete={m.complete}
                  isCurrent={m.isCurrent}
                  disabled={busy}
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
                  className={`min-w-0 flex-1 truncate text-[13.5px] font-semibold ${
                    m.complete ? "text-done" : m.isCurrent ? "text-accent-fg" : "text-ink-muted"
                  }`}
                  title={`${m.label} · updated ${fmt(m.updatedAt)}`}
                >
                  {m.label}
                </span>
                <span className="font-mono text-[11.5px] text-ink-faint">
                  {doneCount}/{m.subtasks.length}
                </span>
              </div>
              <ul className="mt-3 flex flex-col gap-2.5 border-t border-edge pt-3">
                {m.subtasks.map((s) => {
                  return (
                    <li key={s.key}>
                      <label
                        className={`flex items-start gap-2.5 text-[13px] leading-snug ${
                          subtaskMut.isPending ? "cursor-not-allowed" : "cursor-pointer"
                        } ${s.checked ? "text-ink-muted" : "text-ink"}`}
                        title={`Updated ${fmt(s.updatedAt)}`}
                      >
                        <SubtaskCheckbox
                          checked={s.checked}
                          disabled={subtaskMut.isPending}
                          onChange={(checked) =>
                            subtaskMut.mutate({ milestone: m.key, subtask: s.key, checked })
                          }
                          isPending={
                            subtaskMut.isPending &&
                            subtaskMut.variables?.milestone === m.key &&
                            subtaskMut.variables?.subtask === s.key
                          }
                        />
                        <span className={s.checked ? "line-through" : ""}>{s.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * The linked work: the GitHub PRs, and the other refs. The link forms open in place.
 * One row can have many PRs. Each PR has its own Remove button.
 */
export function RowLinks({
  row,
  showPrInput,
  setShowPrInput,
}: {
  row: EnrichedRowView;
  showPrInput: boolean;
  setShowPrInput: (show: boolean) => void;
}) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["rows"] });

  const refsMut = useMutation({
    mutationFn: (v: { action: "add" | "remove"; ref: string }) =>
      api.updateRefs(row.identityRef, v.action, { ref: v.ref }),
    onSettled: invalidate,
  });

  const [newRef, setNewRef] = useState("");
  const [showRefInput, setShowRefInput] = useState(false);
  const [prRefValue, setPrRefValue] = useState("");
  const [prError, setPrError] = useState<string | null>(null);

  const prInputRef = useRef<HTMLInputElement>(null);

  const prs = row.prRefs;
  const otherRefs = row.secondaryRefs;

  const handleLinkPr = async (inputStr: string) => {
    setPrError(null);
    const parsed = parsePrRef(inputStr);
    if (!parsed) {
      setPrError("Invalid format. Use repo#123 or https://github.com/owner/repo/pull/123");
      return;
    }
    // A PR the row already has needs no change. Close the form.
    if (prs.some((p) => p.ref === parsed.fullRef)) {
      setShowPrInput(false);
      setPrRefValue("");
      return;
    }
    await refsMut.mutateAsync({ action: "add", ref: parsed.fullRef });
    setShowPrInput(false);
    setPrRefValue("");
  };

  useEffect(() => {
    if (showPrInput) {
      prInputRef.current?.focus();
      prInputRef.current?.select();
    }
  }, [showPrInput]);

  const isRemoving = (ref: string) =>
    refsMut.isPending && refsMut.variables?.action === "remove" && refsMut.variables?.ref === ref;

  return (
    <section className="flex flex-col gap-6">
      {/* The GitHub PRs, each with its own Remove button */}
      <div>
        <SectionTitle>GitHub PRs</SectionTitle>
        {prs.length > 0 ? (
          <div className="flex flex-col gap-3">
            {prs.map((pr) => (
              <div key={pr.ref} className="flex flex-col gap-1.5">
                <PrBlock pr={pr} />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => refsMut.mutate({ action: "remove", ref: pr.ref })}
                    disabled={isRemoving(pr.ref)}
                    className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-medium text-ink-faint ring-1 ring-edge transition-colors hover:bg-danger/10 hover:text-danger hover:ring-danger/50 disabled:opacity-50"
                  >
                    <DeferredSpinner isPending={isRemoving(pr.ref)} className="h-3 w-3 text-current" />
                    Remove PR
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !showPrInput && <p className="text-[12.5px] text-ink-muted">No PR linked yet.</p>
        )}

        {!showPrInput && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPrInput(true)}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-2 px-4 text-xs font-semibold text-ink-muted ring-1 ring-edge transition-colors hover:bg-surface-3 hover:text-ink"
            >
              <GitPullRequestIcon className="h-3.5 w-3.5 text-accent-fg" />
              Link GitHub PR
            </button>
          </div>
        )}

        {/* The PR form, shown in place when the user links a PR */}
        {showPrInput && (
          <div className="rounded-card bg-surface-2 p-3.5 ring-1 ring-edge text-xs">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                <GitPullRequestIcon className="h-4 w-4 text-accent-fg" /> Link GitHub PR
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowPrInput(false);
                  setPrError(null);
                }}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface-3 hover:text-ink"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLinkPr(prRefValue);
              }}
              className="flex flex-col gap-2"
            >
              <input
                ref={prInputRef}
                autoFocus
                type="text"
                value={prRefValue}
                onChange={(e) => setPrRefValue(e.target.value)}
                placeholder="repo#123 or https://github.com/owner/repo/pull/123"
                className="h-10 w-full rounded-xl border border-edge bg-surface px-3.5 font-mono text-xs text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent"
              />
              <button
                type="submit"
                disabled={refsMut.isPending || !prRefValue.trim()}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-50"
              >
                <DeferredSpinner isPending={refsMut.isPending} className="h-3 w-3 text-current" />
                Link PR
              </button>
            </form>
            {prError && <p role="alert" className="mt-2 text-[11.5px] text-danger">{prError}</p>}
          </div>
        )}
      </div>

      {/* The other refs, with a form to add one */}
      <div>
        <SectionTitle>Other refs</SectionTitle>
        {otherRefs.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {otherRefs.map((r) => (
              <RefPill
                key={r.ref}
                refText={r.ref}
                url={r.resolvedUrl}
                tone="secondary"
                onRemove={() => refsMut.mutate({ action: "remove", ref: r.ref })}
                isRemoving={isRemoving(r.ref)}
              />
            ))}
          </div>
        ) : (
          !showRefInput && <p className="text-[12.5px] text-ink-muted">No other refs.</p>
        )}

        {showRefInput ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = newRef.trim();
              if (!val) return;
              if (val.includes("#") || val.toLowerCase().includes("github.com")) {
                alert("PR refs cannot be added here. Please use the dedicated 'Link GitHub PR' button to link pull requests.");
                setPrRefValue(val);
                setShowPrInput(true);
                setNewRef("");
                setShowRefInput(false);
                return;
              }
              refsMut.mutate(
                { action: "add", ref: val },
                {
                  onSuccess: () => {
                    setNewRef("");
                    setShowRefInput(false);
                  },
                }
              );
            }}
            className="mt-3 flex flex-col gap-2 rounded-card bg-surface-2 p-3.5 ring-1 ring-edge"
          >
            <input
              value={newRef}
              onChange={(e) => setNewRef(e.target.value)}
              placeholder="Ref (PES-123, ZT-456)"
              className="h-10 w-full rounded-xl border border-edge bg-surface px-3.5 font-mono text-xs text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={refsMut.isPending || !newRef.trim()}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-40"
              >
                <DeferredSpinner isPending={refsMut.isPending && refsMut.variables?.action === "add"} className="h-3 w-3 text-current" />
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRefInput(false);
                  setNewRef("");
                }}
                className="h-9 rounded-full px-3.5 text-xs font-medium text-ink-faint transition-colors hover:bg-surface-3 hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowRefInput(true)}
            className="mt-3 inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-2 px-4 text-xs font-semibold text-ink-muted ring-1 ring-edge transition-colors hover:bg-surface-3 hover:text-ink"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add Secondary Ref
          </button>
        )}
      </div>
    </section>
  );
}

/**
 * The row actions. "Delete row" is on the left, away from the others, because it cannot be undone.
 * The footer stays at the bottom of the modal while the body scrolls.
 */
export function RowFooter({ row }: { row: EnrichedRowView }) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["rows"] });

  const deleteMut = useMutation({ mutationFn: () => api.deleteRow(row.identityRef), onSettled: invalidate });
  const completeMut = useMutation({ mutationFn: () => api.completeRow(row.identityRef), onSettled: invalidate });
  const wontFixMut = useMutation({ mutationFn: () => api.wontFixRow(row.identityRef), onSettled: invalidate });

  const anyPending = deleteMut.isPending || completeMut.isPending || wontFixMut.isPending;

  return (
    <footer className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t border-edge bg-bg/95 px-5 py-4 backdrop-blur sm:px-6">
      <button
        type="button"
        disabled={anyPending}
        onClick={() => {
          // Warning first: the delete cannot be undone, so the user confirms it.
          if (window.confirm(`Delete the row for ${row.identityRef}? This cannot be undone.`)) {
            deleteMut.mutate();
          }
        }}
        className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs font-medium text-ink-faint ring-1 ring-edge transition-colors hover:bg-danger/10 hover:text-danger hover:ring-danger/50 disabled:opacity-50"
      >
        <DeferredSpinner isPending={deleteMut.isPending} className="h-3 w-3 text-current" />
        {!deleteMut.isPending && <TrashIcon className="h-3.5 w-3.5" />}
        Delete row
      </button>

      {!row.isComplete && (
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={anyPending}
            onClick={() => wontFixMut.mutate()}
            className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-surface px-4 text-xs font-semibold text-ink-muted ring-1 ring-edge transition-colors hover:bg-warn/10 hover:text-warn hover:ring-warn/50 disabled:opacity-50"
            title="Mark row as Won't Fix and hide it"
          >
            <DeferredSpinner isPending={wontFixMut.isPending} className="h-3 w-3 text-current" />
            Won&apos;t fix
          </button>
          <button
            type="button"
            disabled={anyPending}
            onClick={() => completeMut.mutate()}
            className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-done-soft px-5 text-xs font-semibold text-done ring-1 ring-done/40 transition-colors hover:bg-done hover:text-accent-ink disabled:opacity-50"
            title="Tick all remaining milestones & sub-tasks and complete row"
          >
            <DeferredSpinner isPending={completeMut.isPending} className="h-3 w-3 text-current" />
            Mark as complete
          </button>
        </div>
      )}
    </footer>
  );
}
