"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { Spinner } from "./spinner";

export function RefPill({
  refText,
  url,
  tone,
  jiraStatus,
  statusBadge,
  onRemove,
  isRemoving = false,
}: {
  refText: string;
  url: string | null;
  tone: "identity-support" | "identity-support-light" | "identity-product" | "secondary";
  jiraStatus?: { statusName: string; statusCategory: string } | null;
  statusBadge?: React.ReactNode;
  onRemove?: () => void;
  isRemoving?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const showRemovingLoader = useDeferredLoading(isRemoving);

  // Ephemeral in-memory fetch on hover — never stored in DB
  const { data: preview, isLoading: isLoadingPreview } = useQuery({
    queryKey: ["preview", refText],
    queryFn: () => api.previewRef(refText),
    enabled: isHovered && Boolean(refText),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const bgToneClass =
    tone === "identity-support"
      ? "bg-support/15 border-support/30"
      : tone === "identity-support-light"
        ? "bg-support-light/15 border-support-light/30"
        : tone === "identity-product"
          ? "bg-product/15 border-product/30"
          : "bg-surface-2 border-edge";

  const originLabel =
    tone === "identity-product"
      ? "Product Feature"
      : tone === "identity-support"
        ? "Support Bug"
        : tone === "identity-support-light"
          ? "Support Task"
          : "Secondary Ref";

  const inner = (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border ${bgToneClass} px-2.5 py-[3px] font-mono text-[11px] hover:border-edge-strong transition-colors cursor-pointer`}
    >
      <span className="font-semibold text-ink">{refText}</span>
      {statusBadge && <span className="inline-flex items-center ml-0.5">{statusBadge}</span>}
    </span>
  );

  return (
    <span
      className="relative group/pill inline-flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="hover:opacity-85 transition-opacity"
          title={`Open ${refText} in external tool`}
        >
          {inner}
        </a>
      ) : (
        inner
      )}
      {onRemove && (
        <>
          {showRemovingLoader ? (
            <span className="ml-1 inline-flex items-center justify-center">
              <Spinner className="h-2.5 w-2.5 text-danger" />
            </span>
          ) : (
            <button
              onClick={onRemove}
              disabled={isRemoving}
              title="Remove ref"
              className="ml-1 hidden text-xs font-bold text-ink-faint hover:text-danger group-hover/pill:inline disabled:opacity-40 cursor-pointer"
            >
              ×
            </button>
          )}
        </>
      )}

      {/* Hover Popover Card */}
      <div className="absolute left-0 top-full mt-1.5 hidden group-hover/pill:block z-30 w-64 rounded-xl border border-edge bg-surface p-3 shadow-xl text-xs text-ink pointer-events-none transition-all">
        <div className="flex items-center justify-between border-b border-edge/60 pb-1.5 mb-2 font-mono text-[11px]">
          <span className="font-semibold text-accent">{refText}</span>
          <span className="text-[10px] text-ink-muted px-1.5 py-0.5 rounded bg-surface-2">{originLabel}</span>
        </div>

        {/* Ephemeral title preview */}
        {preview?.title ? (
          <div className="mb-2 pb-2 border-b border-edge/60">
            <p className="text-[11.5px] font-medium text-ink leading-snug line-clamp-2" title={preview.title}>
              &ldquo;{preview.title}&rdquo;
            </p>
          </div>
        ) : isLoadingPreview ? (
          <div className="mb-2 pb-1.5 border-b border-edge/60">
            <p className="text-[10.5px] text-ink-faint italic flex items-center gap-1.5">
              <Spinner className="h-2.5 w-2.5 text-accent shrink-0" />
              <span>Loading title…</span>
            </p>
          </div>
        ) : null}

        {jiraStatus ? (
          <div className="space-y-1.5 text-[11.5px]">
            <div className="flex justify-between">
              <span className="text-ink-muted">Jira Status:</span>
              <span className="font-medium">{jiraStatus.statusName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Category:</span>
              <span className="font-medium capitalize">{jiraStatus.statusCategory.replace("inprogress", "In Progress")}</span>
            </div>
          </div>
        ) : (
          <p className="text-ink-faint text-[11px] italic">No active Jira sync</p>
        )}

        {url && (
          <div className="mt-2.5 pt-1.5 border-t border-edge/60 text-[10.5px] text-accent font-medium text-right">
            Click pill to open in Jira ↗
          </div>
        )}
      </div>
    </span>
  );
}
