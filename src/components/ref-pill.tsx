"use client";

import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { Spinner } from "./spinner";

export function RefPill({
  refText,
  url,
  tone,
  onRemove,
  isRemoving = false,
}: {
  refText: string;
  url: string | null;
  tone: "identity-support" | "identity-product" | "secondary";
  onRemove?: () => void;
  isRemoving?: boolean;
}) {
  const showRemovingLoader = useDeferredLoading(isRemoving);
  const toneClass =
    tone === "identity-support"
      ? "border-support text-support font-medium text-[11.5px]"
      : tone === "identity-product"
        ? "border-product text-product font-medium text-[11.5px]"
        : "border-edge text-ink-muted text-[11px]";

  const inner = (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border bg-surface-2 px-2.5 py-[3px] font-mono ${toneClass}`}
    >
      {refText}
      {url && (
        <span aria-hidden className="text-[9px] opacity-70">
          ↗
        </span>
      )}
    </span>
  );

  return (
    <span className="group/pill inline-flex items-center">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer noopener" className="hover:opacity-75" title={url}>
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
              className="ml-0.5 hidden text-xs text-ink-faint hover:text-danger group-hover/pill:inline disabled:opacity-40"
            >
              ×
            </button>
          )}
        </>
      )}
    </span>
  );
}
