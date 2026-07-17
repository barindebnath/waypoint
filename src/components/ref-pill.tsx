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
      ? "border-support/50 text-support"
      : tone === "identity-product"
        ? "border-product/50 text-product"
        : "border-edge text-ink-muted";

  const inner = (
    <span className={`inline-flex items-center gap-1 rounded-full border bg-surface-2 px-2 py-0.5 font-mono text-xs ${toneClass}`}>
      {refText}
      {url && <span aria-hidden className="text-[9px] opacity-70">↗</span>}
    </span>
  );

  return (
    <span className="group/pill inline-flex items-center">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer noopener" className="hover:opacity-80" title={url}>
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
