"use client";

import { useState, Fragment, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type EnrichedRowView } from "@/lib/client-api";
import { inRange, type InspectRange } from "@/lib/inspect";
import { RefPill } from "./ref-pill";
import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { Spinner } from "./spinner";
import { DeferredSpinner } from "./deferred-spinner";
import { parsePrRef } from "@/lib/github";
import { GithubPrBadge, JiraStatusBadge, GitPullRequestIcon } from "./status-badge";

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

function fmtAge(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  if (ms < 0 || isNaN(ms)) return "just now";
  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days >= 1) return `${days}d`;
  if (hours >= 1) return `${hours}h`;
  if (minutes >= 1) return `${minutes}m`;
  return "<1m";
}

type EnrichedRef = EnrichedRowView["secondaryRefs"][number];

function PrRefPill({
  prRef,
  readOnly,
  onRemove,
  isRemoving,
  className = "",
}: {
  prRef: EnrichedRef;
  readOnly?: boolean;
  onRemove?: () => void;
  isRemoving?: boolean;
  className?: string;
}) {
  const showRemovingLoader = useDeferredLoading(!!isRemoving);

  const innerPill = (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface-2 px-2.5 py-[3px] font-mono text-[11px] text-ink-muted hover:border-edge-strong transition-colors cursor-pointer`}>
      <GitPullRequestIcon className="h-3 w-3 text-accent shrink-0" />
      <span className="font-semibold text-ink">{prRef.ref}</span>
      {prRef.prStatus && (
        <GithubPrBadge
          state={prRef.prStatus.state}
          mergeableState={prRef.prStatus.mergeableState}
          reviewDecision={prRef.prStatus.reviewDecision}
        />
      )}
    </span>
  );

  return (
    <span className={`relative group/pr items-center ${className || "inline-flex"}`}>
      {prRef.resolvedUrl ? (
        <a
          href={prRef.resolvedUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="hover:opacity-85 transition-opacity"
          title={`Open ${prRef.ref} in GitHub`}
        >
          {innerPill}
        </a>
      ) : (
        innerPill
      )}

      {onRemove && !readOnly && (
        <>
          {showRemovingLoader ? (
            <span className="ml-1 inline-flex items-center justify-center">
              <Spinner className="h-2.5 w-2.5 text-danger" />
            </span>
          ) : (
            <button
              type="button"
              onClick={onRemove}
              disabled={isRemoving}
              className="ml-1 hidden group-hover/pr:inline text-xs font-bold text-ink-faint hover:text-danger cursor-pointer"
              title="Remove linked PR"
            >
              ×
            </button>
          )}
        </>
      )}

      {/* Hover Popover Card */}
      <div className="absolute left-0 top-full mt-1.5 hidden group-hover/pr:block z-30 w-64 rounded-xl border border-edge bg-surface p-3 shadow-xl text-xs text-ink pointer-events-none transition-all">
        <div className="flex items-center justify-between border-b border-edge/60 pb-1.5 mb-2 font-mono text-[11px]">
          <span className="font-semibold text-accent flex items-center gap-1">
            <GitPullRequestIcon className="h-3.5 w-3.5" /> {prRef.ref}
          </span>
          <span className="text-[10px] text-ink-faint">GitHub PR</span>
        </div>
        {prRef.prStatus ? (
          <div className="space-y-1.5 text-[11.5px]">
            <div className="flex justify-between">
              <span className="text-ink-muted">State:</span>
              <span className="font-medium capitalize">{prRef.prStatus.state}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Review Decision:</span>
              <span className="font-medium capitalize">
                {prRef.prStatus.reviewDecision === "none" ? "Pending" : prRef.prStatus.reviewDecision.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Mergeable:</span>
              <span className={prRef.prStatus.mergeableState === "dirty" ? "font-semibold text-danger" : "font-medium text-done"}>
                {prRef.prStatus.mergeableState === "dirty" ? "⚠️ Has Conflicts" : "Clean"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-ink-faint text-[11px] italic">Live status pending sync…</p>
        )}
        {prRef.resolvedUrl && (
          <div className="mt-2.5 pt-1.5 border-t border-edge/60 text-[10.5px] text-accent font-medium text-right">
            Click pill to open on GitHub ↗
          </div>
        )}
      </div>
    </span>
  );
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
  const completeMut = useMutation({ mutationFn: () => api.completeRow(row.identityRef), onSettled: invalidate });
  const wontFixMut = useMutation({ mutationFn: () => api.wontFixRow(row.identityRef), onSettled: invalidate });

  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  const [showPrInput, setShowPrInput] = useState(false);
  const [showRefInput, setShowRefInput] = useState(false);
  const [prRefValue, setPrRefValue] = useState("");
  const [prError, setPrError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const prRef = row.secondaryRefs.find((r) => r.kind === "github_pr");
  const otherRefs = row.secondaryRefs.filter((r) => r.kind !== "github_pr");

  const handleLinkPr = async (inputStr: string) => {
    setPrError(null);
    const parsed = parsePrRef(inputStr);
    if (!parsed) {
      setPrError("Invalid format. Use repo#123 or https://github.com/owner/repo/pull/123");
      return;
    }
    // Enforce 1-to-1 PR mapping
    const existingPr = row.secondaryRefs.find((r) => r.kind === "github_pr");
    if (existingPr) {
      if (existingPr.ref === parsed.fullRef) {
        setShowPrInput(false);
        setPrRefValue("");
        return;
      }
      await api.updateRefs(row.identityRef, "remove", { ref: existingPr.ref });
    }
    await refsMut.mutateAsync({ action: "add", ref: parsed.fullRef });
    setShowPrInput(false);
    setPrRefValue("");
  };

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
        row.isComplete ? "opacity-55" : ""
      }`}
    >
      {/* Collapsed line */}
      <div
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3.5 px-4 py-[13px] text-left cursor-pointer select-none"
      >
        <span className="flex min-w-0 shrink-0 items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <RefPill
            refText={row.identityRef}
            url={row.identityResolvedUrl}
            tone={identityTone}
            jiraStatus={row.jiraStatus}
            statusBadge={
              row.jiraStatus ? (
                <JiraStatusBadge
                  statusName={row.jiraStatus.statusName}
                  statusCategory={row.jiraStatus.statusCategory}
                />
              ) : undefined
            }
          />

          {/* Dedicated GitHub PR Pill Badge (Desktop / Medium screens) */}
          {prRef ? (
            <PrRefPill
              prRef={prRef}
              readOnly={readOnly}
              onRemove={() => refsMut.mutate({ action: "remove", ref: prRef.ref })}
              isRemoving={refsMut.isPending && refsMut.variables?.action === "remove" && refsMut.variables?.ref === prRef.ref}
              className="hidden sm:inline-flex"
            />
          ) : (
            !readOnly && (
              <button
                type="button"
                onClick={() => setShowPrInput(true)}
                className="hidden sm:inline-flex items-center gap-1 rounded-full border border-dashed border-edge px-2 py-0.5 font-mono text-[11px] text-ink-muted hover:border-accent hover:text-accent transition-colors"
                title="Link a GitHub PR to this card (1 PR limit)"
              >
                <span>+ Link PR</span>
              </button>
            )
          )}

          {/* Other Secondary Refs */}
          <span className="hidden sm:inline-flex items-center gap-1.5">
            {otherRefs.map((r) => (
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
                  title={`${m.label} — ${m.complete ? "complete" : m.isCurrent ? `current (${fmtAge(m.updatedAt || m.createdAt)})` : "pending"} · ${fmt(m.updatedAt)}`}
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

        <div className="hidden sm:flex flex-col items-end shrink-0 w-[150px]">
          <span
            className={`w-full truncate text-right font-serif text-sm italic ${
              row.isComplete ? "text-done" : "text-accent"
            }`}
          >
            {row.isComplete ? (row.hasLooseEnds ? "won't fix" : "✓ complete") : current?.label}
          </span>
          <span className="text-[10px] text-ink-faint font-mono leading-none mt-0.5" title={`Card age: ${fmtAge(row.createdAt)}`}>
            {row.isComplete
              ? `Age: ${fmtAge(row.createdAt)}`
              : current
                ? `${fmtAge(current.updatedAt || current.createdAt)} in stage`
                : `Age: ${fmtAge(row.createdAt)}`}
          </span>
        </div>
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
      </div>

      {/* Expanded milestones */}
      {open && (
        <div className="border-t border-edge p-4 relative">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-edge/60 pb-2 text-[11px]">
            <span className="font-mono text-ink-muted">
              Card age: <span className="font-semibold text-ink">{fmtAge(row.createdAt)}</span> ({new Date(row.createdAt).toLocaleDateString()})
            </span>
            {current && !row.isComplete && (
              <span className="font-mono text-ink-muted">
                In <span className="font-serif italic text-accent">{current.label}</span>:{" "}
                <span className="font-semibold text-ink">{fmtAge(current.updatedAt || current.createdAt)}</span>
              </span>
            )}
          </div>
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

          {/* Dedicated Link GitHub PR Form */}
          {showPrInput && (
            <div className="mt-3 rounded-lg border border-edge bg-surface-2 p-3 text-xs shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <GitPullRequestIcon className="h-3.5 w-3.5 text-accent" /> Link GitHub PR
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrInput(false);
                    setPrError(null);
                  }}
                  className="text-ink-faint hover:text-ink font-bold text-sm"
                >
                  ×
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLinkPr(prRefValue);
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="text"
                  value={prRefValue}
                  onChange={(e) => setPrRefValue(e.target.value)}
                  placeholder="repo#123 or https://github.com/owner/repo/pull/123"
                  className="flex-1 rounded-[7px] border border-edge bg-surface px-2.5 py-1.5 font-mono text-xs outline-none focus:border-accent text-ink"
                />
                <button
                  type="submit"
                  disabled={refsMut.isPending || !prRefValue.trim()}
                  className="rounded-[7px] bg-accent px-3.5 py-1.5 font-semibold text-accent-ink hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <DeferredSpinner isPending={refsMut.isPending} className="h-3 w-3 text-current" />
                  {prRef ? "Replace PR" : "Link PR"}
                </button>
              </form>
              {prError && <p className="text-danger text-[11px] mt-1.5">{prError}</p>}
            </div>
          )}

          {/* Row actions */}
          {!readOnly && (
            <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
              {showRefInput ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = newRef.trim();
                    if (!val) return;
                    if (val.includes("#") || val.toLowerCase().includes("github.com")) {
                      alert("PR refs cannot be added here. Please use the dedicated '+ Link GitHub PR' button to link pull requests.");
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
                  className="flex items-center gap-1.5 w-full sm:w-auto"
                >
                  <input
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    placeholder="Ref (PES-123, ZT-456)"
                    className="flex-1 min-w-0 sm:w-[190px] rounded-[7px] border border-edge bg-surface-2 px-2.5 py-1.5 font-mono text-[11.5px] outline-none focus:border-accent"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={refsMut.isPending || !newRef.trim()}
                    className="rounded-[7px] bg-accent px-3 py-1.5 text-[11.5px] font-semibold text-accent-ink hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
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
                    className="rounded-[7px] border border-edge bg-surface-2 px-2.5 py-1.5 text-[11.5px] font-medium text-ink-faint hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowRefInput(true)}
                  className="rounded-[7px] border border-edge bg-surface-2 hover:border-edge-strong px-3 py-1.5 text-[11.5px] font-semibold text-ink-muted hover:text-ink flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  + Add Secondary Ref
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPrInput(!showPrInput)}
                className="rounded-[7px] border border-edge bg-surface-2 hover:border-edge-strong px-3 py-1.5 text-[11.5px] font-semibold text-ink-muted hover:text-ink flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <GitPullRequestIcon className="h-3.5 w-3.5 text-accent" />
                {prRef ? "Edit Linked PR" : "+ Link GitHub PR"}
              </button>
              {(otherRefs.length > 0 || prRef) && (
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {/* PR ref at bottom only on small screens (sm:hidden) to save space on top */}
                  {prRef && (
                    <PrRefPill
                      prRef={prRef}
                      readOnly={readOnly}
                      onRemove={() => refsMut.mutate({ action: "remove", ref: prRef.ref })}
                      isRemoving={refsMut.isPending && refsMut.variables?.action === "remove" && refsMut.variables?.ref === prRef.ref}
                      className="sm:hidden"
                    />
                  )}
                  {otherRefs.map((r) => {
                    const isRemoving =
                      refsMut.isPending &&
                      refsMut.variables?.action === "remove" &&
                      refsMut.variables?.ref === r.ref;
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
              <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-2">
                {!row.isComplete && (
                  <button
                    type="button"
                    disabled={wontFixMut.isPending || completeMut.isPending || deleteMut.isPending}
                    onClick={() => wontFixMut.mutate()}
                    className="flex-1 sm:flex-initial rounded-[7px] border border-edge bg-surface-2 hover:border-warn hover:text-warn px-3 py-1.5 text-[11.5px] font-semibold text-ink-muted hover:bg-warn/10 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    title="Mark row as Won't Fix and hide it"
                  >
                    <DeferredSpinner isPending={wontFixMut.isPending} className="h-3 w-3 text-current" />
                    Won&apos;t fix
                  </button>
                )}
                {!row.isComplete && (
                  <button
                    type="button"
                    disabled={completeMut.isPending || wontFixMut.isPending || deleteMut.isPending}
                    onClick={() => completeMut.mutate()}
                    className="flex-1 sm:flex-initial rounded-[7px] border border-done/40 bg-done/10 hover:bg-done hover:text-accent-ink px-3 py-1.5 text-[11.5px] font-semibold text-done disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    title="Tick all remaining milestones & sub-tasks and complete row"
                  >
                    <DeferredSpinner isPending={completeMut.isPending} className="h-3 w-3 text-current" />
                    Mark as complete
                  </button>
                )}
                <button
                  disabled={deleteMut.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete the row for ${row.identityRef}? This cannot be undone.`)) {
                      deleteMut.mutate();
                    }
                  }}
                  className="flex-1 sm:flex-initial rounded-[7px] border border-edge px-3 py-1.5 text-[11.5px] text-ink-faint hover:border-danger hover:text-danger hover:bg-danger/5 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <DeferredSpinner isPending={deleteMut.isPending} className="h-3 w-3 text-current" />
                  Delete row
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
