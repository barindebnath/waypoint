"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type EnrichedRowView } from "@/lib/client-api";
import { RefPill } from "./ref-pill";
import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { Spinner } from "./spinner";
import { DeferredSpinner } from "./deferred-spinner";
import { parsePrRef } from "@/lib/github";
import { GithubPrBadge, GitPullRequestIcon } from "./status-badge";

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

const PR_STATE_CLASS: Record<"open" | "closed" | "merged" | "draft", string> = {
  open: "border-done/40 text-done",
  closed: "border-danger/40 text-danger",
  merged: "border-purple-400/40 text-purple-400",
  draft: "border-edge text-ink-muted",
};

function PrRefPill({
  prRef,
  onRemove,
  isRemoving,
  className = "",
}: {
  prRef: EnrichedRef;
  onRemove?: () => void;
  isRemoving?: boolean;
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const showRemovingLoader = useDeferredLoading(!!isRemoving);

  const { data: preview, isLoading: isLoadingPreview } = useQuery({
    queryKey: ["preview", prRef.ref],
    queryFn: () => api.previewRef(prRef.ref),
    enabled: isHovered && Boolean(prRef.ref),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

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
    <span
      className={`relative group/pr items-center ${className || "inline-flex"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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

      {onRemove && (
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
      <div className="absolute left-0 top-full mt-1.5 hidden group-hover/pr:block z-30 w-80 rounded-xl border border-edge bg-surface p-3 shadow-xl text-xs text-ink pointer-events-none transition-all">
        <div className="flex items-center justify-between border-b border-edge/60 pb-1.5 mb-2 font-mono text-[11px]">
          <span className="font-semibold text-accent flex items-center gap-1">
            <GitPullRequestIcon className="h-3.5 w-3.5" /> {prRef.ref}
          </span>
          <span className="text-[10px] text-ink-faint">GitHub PR</span>
        </div>

        {/* Ephemeral PR preview: state, repo, age, title, author, and diff size */}
        {preview?.pr ? (
          <div className="mb-2 pb-2 border-b border-edge/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10.5px] text-ink-muted">
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-[1px] font-medium capitalize ${PR_STATE_CLASS[preview.pr.state]}`}
              >
                <GitPullRequestIcon className="h-2.5 w-2.5" />
                {preview.pr.state}
              </span>
              <span className="truncate font-mono">
                {preview.pr.owner}/{preview.pr.repo} #{preview.pr.number}
              </span>
              {preview.pr.updatedAt && (
                <span className="ml-auto shrink-0 text-ink-faint" title={`Updated ${fmt(preview.pr.updatedAt)}`}>
                  {fmtAge(preview.pr.updatedAt)} ago
                </span>
              )}
            </div>
            <p className="text-[12px] font-medium text-ink leading-snug line-clamp-3">{preview.pr.title}</p>
            <div className="flex items-center gap-1.5 text-[10.5px]">
              {preview.pr.authorAvatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- small remote avatar; next/image would need remotePatterns config
                <img src={preview.pr.authorAvatarUrl} alt="" className="h-4 w-4 rounded-full" />
              )}
              {preview.pr.authorLogin && <span className="truncate text-ink-muted">{preview.pr.authorLogin}</span>}
              <span className="ml-auto shrink-0 rounded-md border border-edge px-1.5 py-[1px] font-mono">
                <span className="text-done">+{preview.pr.additions.toLocaleString()}</span>{" "}
                <span className="text-danger">−{preview.pr.deletions.toLocaleString()}</span>
              </span>
              <span className="shrink-0 rounded-md border border-edge px-1.5 py-[1px] font-mono text-ink-muted">
                {preview.pr.changedFiles} {preview.pr.changedFiles === 1 ? "file" : "files"}
              </span>
            </div>
          </div>
        ) : isLoadingPreview ? (
          <div className="mb-2 pb-1.5 border-b border-edge/60">
            <p className="text-[10.5px] text-ink-faint italic flex items-center gap-1.5">
              <Spinner className="h-2.5 w-2.5 text-accent shrink-0" />
              <span>Loading PR details…</span>
            </p>
          </div>
        ) : null}

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

/**
 * The editable row: the milestone grid with its sub-tasks, the PR and ref editors, and the row actions.
 * The Board card modal shows it.
 */
export function RowDetails({
  row,
  showPrInput,
  setShowPrInput,
}: {
  row: EnrichedRowView;
  showPrInput: boolean;
  setShowPrInput: (show: boolean) => void;
}) {
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
  const [showRefInput, setShowRefInput] = useState(false);
  const [prRefValue, setPrRefValue] = useState("");
  const [prError, setPrError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const prInputRef = useRef<HTMLInputElement>(null);

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

  // The component mounts only when the row is open, so these run once per open.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    handleScroll();
    el.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (showPrInput) {
      prInputRef.current?.focus();
      prInputRef.current?.select();
    }
  }, [showPrInput]);

  return (
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
            return (
              <div
                key={m.key}
                className={`rounded-[9px] border bg-surface-2 px-3 py-[11px] transition-colors ${
                  m.isCurrent
                    ? "border-accent ring-1 ring-accent/20"
                    : "border-edge"
                }`}
              >
                <div className="mb-2 flex items-center gap-[7px] border-b border-edge pb-2">
                  <MilestoneCircle
                    complete={m.complete}
                    isCurrent={m.isCurrent}
                    disabled={
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
                    return (
                      <li key={s.key}>
                        <label
                          className={`flex items-start gap-[7px] text-xs ${ subtaskMut.isPending ? "cursor-not-allowed" : "cursor-pointer"
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
                          <span className={s.checked ? "line-through" : ""}>
                            {s.label}
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
              ref={prInputRef}
              autoFocus
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
            {/* The linked PR, with a remove button */}
            {prRef && (
              <PrRefPill
                prRef={prRef}
                onRemove={() => refsMut.mutate({ action: "remove", ref: prRef.ref })}
                isRemoving={refsMut.isPending && refsMut.variables?.action === "remove" && refsMut.variables?.ref === prRef.ref}
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
    </div>
  );
}
