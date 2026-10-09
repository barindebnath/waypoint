"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { api, type EnrichedRowView } from "@/lib/client-api";
import type { EnrichedRef } from "@/lib/links";
import { RowDetails } from "./row-card";
import { GithubPrBadge, GitPullRequestIcon, JiraStatusBadge } from "./status-badge";

/**
 * Compact, read-only card for the Board view.
 *
 * The card has no actions of its own. A click on the card opens a modal with the full,
 * editable row (RowDetails). "Mark as complete" and "Won't fix" are in that modal.
 *
 * The title, the issue type and the PR details come from the preview endpoint.
 * The app does not store them; React Query keeps them in memory for 10 minutes.
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

const PREVIEW_STALE_MS = 10 * 60 * 1000;

type PreviewData = Awaited<ReturnType<typeof api.previewRef>>;

/**
 * Fixed preview data for a static card, keyed by ref (the landing page uses it).
 * With a resolver, the card makes no API calls.
 */
const StaticPreviewContext = createContext<((ref: string) => PreviewData | null) | null>(null);

export function StaticPreviewProvider({
  resolve,
  children,
}: {
  resolve: (ref: string) => PreviewData | null;
  children: React.ReactNode;
}) {
  return <StaticPreviewContext.Provider value={resolve}>{children}</StaticPreviewContext.Provider>;
}

/** Same query key as the RefPill hover card, so both use one cached request. */
function usePreview(ref: string): { data: PreviewData | undefined } {
  const resolve = useContext(StaticPreviewContext);
  const query = useQuery({
    queryKey: ["preview", ref],
    queryFn: () => api.previewRef(ref),
    staleTime: PREVIEW_STALE_MS,
    retry: false,
    enabled: !resolve,
  });
  return resolve ? { data: resolve(ref) ?? undefined } : query;
}

/** One linked PR: repo#number, line changes, title, review state, unresolved threads and a link to GitHub. */
function PrBlock({ pr }: { pr: EnrichedRef }) {
  const { data } = usePreview(pr.ref);
  const preview = data?.pr;
  const label = preview ? `${preview.repo}#${preview.number}` : pr.ref;
  const unresolved = preview?.unresolvedThreads ?? 0;
  // The review state comes from the PR status cache, which the sync fills.
  const approved = pr.prStatus?.reviewDecision === "approved" && pr.prStatus.state !== "merged";

  return (
    <div className={`rounded-[8px] border bg-surface-2 p-2 ${approved ? "border-done/50" : "border-edge"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1 font-mono text-[11px] font-semibold text-ink">
          <GitPullRequestIcon className="h-3 w-3 shrink-0 text-accent" />
          <span className="truncate" title={pr.ref}>{label}</span>
        </span>
        {preview && (
          <span className="shrink-0 rounded-[5px] border border-edge px-1.5 font-mono text-[10px]">
            <span className="text-done">+{preview.additions}</span>{" "}
            <span className="text-danger">-{preview.deletions}</span>
          </span>
        )}
      </div>
      {preview?.title && (
        <p className="mt-1 truncate text-[11.5px] text-ink-muted" title={preview.title}>
          {preview.title}
        </p>
      )}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
          {pr.prStatus && (
            <GithubPrBadge
              state={pr.prStatus.state}
              mergeableState={pr.prStatus.mergeableState}
              reviewDecision={pr.prStatus.reviewDecision}
            />
          )}
          {unresolved > 0 && (
            <span className="rounded-[5px] border border-warn/50 bg-warn/10 px-1.5 text-[10.5px] font-semibold text-warn">
              {unresolved} Unresolved
            </span>
          )}
        </span>
        {pr.resolvedUrl && (
          <a
            href={pr.resolvedUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="font-mono text-[10.5px] text-accent underline underline-offset-2 hover:opacity-80"
          >
            Inspect →
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * `preview`: a static card (landing page). It does not open the modal and it is not focusable,
 * because the modal edits real data.
 */
export function BoardCard({ row, preview = false }: { row: EnrichedRowView; preview?: boolean }) {
  const [open, setOpen] = useState(false);

  const current = row.milestones.find((m) => m.isCurrent);
  const checked = current?.subtasks.filter((s) => s.checked).length ?? 0;
  const total = current?.subtasks.length ?? 0;
  const next = current?.subtasks.find((s) => !s.checked);

  // A click on a link or a button inside the card does its own job. A click anywhere else opens the modal.
  // React sends clicks from the modal portal up to this card too, so ignore targets outside the card element.
  const onCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (preview) return;
    const target = e.target as HTMLElement;
    if (!e.currentTarget.contains(target) || target.closest("a, button")) return;
    setOpen(true);
  };
  const onCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (preview || e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div
      tabIndex={preview ? undefined : 0}
      aria-haspopup={preview ? undefined : "dialog"}
      aria-label={preview ? undefined : `Open ${row.identityRef}`}
      onClick={onCardClick}
      onKeyDown={onCardKeyDown}
      className={`rounded-[10px] border border-edge bg-surface p-3 shadow-card outline-none transition-[opacity,border-color] ${
        preview ? "" : "cursor-pointer hover:border-edge-strong focus-visible:border-accent"
      } ${
        row.isComplete ? "opacity-70" : ""
      }`}
    >
      <CardSummary row={row} />

      {/* Progress inside the current milestone */}
      {current && (
        <div className="mt-2">
          {/* One dash for each sub-task. The column already shows the milestone, so the dashes have no label. */}
          <div
            className="flex gap-1"
            role="img"
            aria-label={`${current.label}: ${checked} of ${total} sub-tasks done`}
            title={`${current.label}: ${checked}/${total}`}
          >
            {current.subtasks.map((s, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${s.checked ? "bg-accent" : "bg-surface-3"}`}
              />
            ))}
          </div>
          {next && (
            <div className="mt-1.5 truncate text-[11px] text-ink-muted" title={next.label}>
              <span className="font-mono text-[10px] text-ink-faint">Next: </span>
              {next.label}
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

      {open && <CardModal row={row} onClose={() => setOpen(false)} />}
    </div>
  );
}

/** Key, Jira status, title, issue type, time in stage and linked PRs, as the card shows them. */
function CardSummary({ row }: { row: EnrichedRowView }) {
  const { data: identity } = usePreview(row.identityRef);
  const dotTone =
    row.pipelineKey === "support_light" ? "bg-support-light" : row.origin === "support" ? "bg-support" : "bg-product";
  const current = row.milestones.find((m) => m.isCurrent);
  const prs = row.secondaryRefs.filter((r) => r.kind === "github_pr");
  // If Jira does not give an issue type, show the pipeline label.
  const typeLabel = identity?.issueType || `${row.pipelineLabel}${row.subType ? ` · ${row.subType}` : ""}`;

  return (
    <>
        {/* Key + Jira status */}
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotTone}`} aria-hidden />
            {row.identityResolvedUrl ? (
              <a
                href={row.identityResolvedUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="truncate font-mono text-[12px] font-semibold text-ink hover:underline"
              >
                {row.identityRef}
              </a>
            ) : (
              <span className="truncate font-mono text-[12px] font-semibold text-ink">{row.identityRef}</span>
            )}
          </span>
          {row.jiraStatus && (
            <span className="shrink-0">
              <JiraStatusBadge statusName={row.jiraStatus.statusName} statusCategory={row.jiraStatus.statusCategory} />
            </span>
          )}
        </div>

        {/* Title from Jira (or from GitHub, if the identity is a PR) */}
        {identity?.title && (
          <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-ink" title={identity.title}>
            {identity.title}
          </p>
        )}

        <div className="mt-1.5 flex items-center justify-between gap-2 text-[10.5px] font-mono text-ink-faint">
          <span className="truncate">{typeLabel}</span>
          <span title={`Card age: ${fmtAge(row.createdAt)}`} className="shrink-0">
            {current ? `${fmtAge(current.updatedAt || current.createdAt)} in stage` : `age ${fmtAge(row.createdAt)}`}
          </span>
        </div>

        {/* Linked PRs */}
        {prs.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-1.5 border-t border-edge/60 pt-2.5">
            {prs.map((r) => (
              <PrBlock key={r.ref} pr={r} />
            ))}
          </div>
        )}
    </>
  );
}

/**
 * The modal header uses the full width: the key, status, type and ages on one line, the title below,
 * and the linked PRs in a column on the right. On a narrow screen the PRs go below the title.
 */
function ModalHeader({ row, onClose }: { row: EnrichedRowView; onClose: () => void }) {
  const { data: identity } = usePreview(row.identityRef);
  const dotTone =
    row.pipelineKey === "support_light" ? "bg-support-light" : row.origin === "support" ? "bg-support" : "bg-product";
  const current = row.milestones.find((m) => m.isCurrent);
  const prs = row.secondaryRefs.filter((r) => r.kind === "github_pr");
  const typeLabel = identity?.issueType || `${row.pipelineLabel}${row.subType ? ` · ${row.subType}` : ""}`;

  return (
    <header className="relative flex flex-col gap-3 p-4 pr-12 md:flex-row md:items-start md:gap-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-ink-faint">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotTone}`} aria-hidden />
          {row.identityResolvedUrl ? (
            <a
              href={row.identityResolvedUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-[13px] font-semibold text-ink hover:underline"
            >
              {row.identityRef}
            </a>
          ) : (
            <span className="text-[13px] font-semibold text-ink">{row.identityRef}</span>
          )}
          {row.jiraStatus && (
            <JiraStatusBadge statusName={row.jiraStatus.statusName} statusCategory={row.jiraStatus.statusCategory} />
          )}
          <span aria-hidden>·</span>
          <span>{typeLabel}</span>
          <span aria-hidden>·</span>
          <span title={new Date(row.createdAt).toLocaleDateString()}>age {fmtAge(row.createdAt)}</span>
          {current && !row.isComplete && (
            <>
              <span aria-hidden>·</span>
              <span>
                {fmtAge(current.updatedAt || current.createdAt)} in <span className="font-serif italic text-accent">{current.label}</span>
              </span>
            </>
          )}
        </div>
        {identity?.title && (
          <h2 className="mt-1.5 text-[15px] font-medium leading-snug text-ink">{identity.title}</h2>
        )}
      </div>
      {prs.length > 0 && (
        <div className="flex w-full shrink-0 flex-col gap-1.5 md:w-[360px]">
          {prs.map((r) => (
            <PrBlock key={r.ref} pr={r} />
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 rounded-[6px] px-2 py-0.5 text-lg leading-none text-ink-faint hover:bg-surface-2 hover:text-ink cursor-pointer"
      >
        ×
      </button>
    </header>
  );
}

/**
 * The full, editable row in a modal dialog (RowDetails).
 * The native <dialog> traps the focus and closes on Escape. A click on the backdrop also closes it.
 * The portal puts the dialog outside the card, so the card hover styles do not apply inside it.
 */
function CardModal({ row, onClose }: { row: EnrichedRowView; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [showPrInput, setShowPrInput] = useState(false);

  // No cleanup: a close() here sends a "close" event, and Strict Mode would then close the modal at once.
  // On unmount, React removes the <dialog>, and that also removes it from the top layer.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    // showModal() focuses the first button (Close), and the browser then shows a focus ring on it.
    // Focus the dialog itself instead. Tab still moves to the first control.
    dialog.focus();
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      aria-label={row.identityRef}
      tabIndex={-1}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop has the dialog itself as the target.
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[min(1100px,calc(100vw-2rem))] max-h-[calc(100dvh-4rem)] overflow-y-auto rounded-xl border border-edge bg-surface p-0 text-ink shadow-xl outline-none backdrop:bg-black/60"
    >
      <ModalHeader row={row} onClose={onClose} />
      <RowDetails row={row} showPrInput={showPrInput} setShowPrInput={setShowPrInput} />
    </dialog>,
    document.body,
  );
}
