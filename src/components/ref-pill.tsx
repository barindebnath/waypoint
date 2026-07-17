"use client";

export function RefPill({
  refText,
  url,
  tone,
  onRemove,
}: {
  refText: string;
  url: string | null;
  tone: "identity-support" | "identity-product" | "secondary";
  onRemove?: () => void;
}) {
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
        <button
          onClick={onRemove}
          title="Remove ref"
          className="ml-0.5 hidden text-xs text-ink-faint hover:text-danger group-hover/pill:inline"
        >
          ×
        </button>
      )}
    </span>
  );
}
