"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import type { EnrichedRef } from "@/lib/links";
import { Chip } from "./chip";
import { ArrowUpRightIcon, PullRequestIcon } from "./icons";
import { GithubPrBadge } from "./status-badge";

/**
 * The linked PR block, used by the Board card and by the card modal.
 * The preview data (title and diff size) comes from the preview endpoint. React Query keeps it for 10 minutes.
 */

const PREVIEW_STALE_MS = 10 * 60 * 1000;

export type PreviewData = Awaited<ReturnType<typeof api.previewRef>>;

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
export function usePreview(ref: string): { data: PreviewData | undefined } {
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
export function PrBlock({ pr }: { pr: EnrichedRef }) {
  const { data } = usePreview(pr.ref);
  const preview = data?.pr;
  const label = preview ? `${preview.repo}#${preview.number}` : pr.ref;
  const unresolved = preview?.unresolvedThreads ?? 0;
  // The review state comes from the PR status cache, which the sync fills.
  const approved = pr.prStatus?.reviewDecision === "approved" && pr.prStatus.state !== "merged";

  return (
    <div className={`rounded-2xl bg-surface-2 p-3 ring-1 ${approved ? "ring-done/50" : "ring-edge"}`}>
      <div className="flex items-center gap-1.5">
        <PullRequestIcon className="h-3.5 w-3.5 shrink-0 text-accent-fg" />
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] font-semibold text-ink" title={pr.ref}>
          {label}
        </span>
        {pr.resolvedUrl && (
          <a
            href={pr.resolvedUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`Inspect ${label} on GitHub`}
            title="Inspect on GitHub"
            className="-my-1 -mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface-3 hover:text-accent-fg"
          >
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      {preview?.title && (
        <p className="mt-1.5 truncate text-[12px] text-ink-muted" title={preview.title}>
          {preview.title}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {pr.prStatus && (
          <GithubPrBadge
            state={pr.prStatus.state}
            mergeableState={pr.prStatus.mergeableState}
            reviewDecision={pr.prStatus.reviewDecision}
          />
        )}
        {unresolved > 0 && <Chip tone="orange">{unresolved} Unresolved</Chip>}
        {preview && (
          <span className="ml-auto shrink-0 rounded-full bg-surface-3 px-2 py-0.5 font-mono text-[10.5px]">
            <span className="text-done">+{preview.additions}</span>{" "}
            <span className="text-danger">-{preview.deletions}</span>
          </span>
        )}
      </div>
    </div>
  );
}
