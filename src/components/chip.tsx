import type { ReactNode } from "react";

/**
 * A small rounded pill. The pastel tones are solid with dark text, as in the reference design.
 * They keep the same look in every theme. `ghost` is a quiet pill for low-priority facts.
 * `accent` is the lime pill of the theme.
 */
export type ChipTone =
  | "pink"
  | "yellow"
  | "mint"
  | "aqua"
  | "salmon"
  | "orange"
  | "red"
  | "slate"
  | "khaki"
  | "lilac"
  | "sky"
  | "lime"
  | "ghost"
  | "accent";

const TONE: Record<ChipTone, string> = {
  pink: "bg-chip-pink text-chip-ink",
  yellow: "bg-chip-yellow text-chip-ink",
  mint: "bg-chip-mint text-chip-ink",
  aqua: "bg-chip-aqua text-chip-ink",
  salmon: "bg-chip-salmon text-chip-ink",
  orange: "bg-chip-orange text-chip-ink",
  red: "bg-chip-red text-chip-ink",
  slate: "bg-chip-slate text-chip-ink",
  khaki: "bg-chip-khaki text-chip-ink",
  lilac: "bg-chip-lilac text-chip-ink",
  sky: "bg-chip-sky text-chip-ink",
  lime: "bg-chip-lime text-chip-ink",
  ghost: "bg-surface-3 text-ink-muted",
  accent: "bg-accent text-accent-ink",
};

export function Chip({
  tone = "slate",
  icon,
  title,
  className = "",
  children,
}: {
  tone?: ChipTone;
  icon?: ReactNode;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className={`inline-flex h-6 max-w-full items-center gap-1 rounded-full px-2.5 text-[11.5px] font-medium leading-none whitespace-nowrap ${TONE[tone]} ${className}`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * The look of each pipeline, used by the card pill, the dot in the sidebar and the Board filter.
 * The key is the pipeline key from the engine.
 */
export const PIPELINE_STYLE: Record<string, { label: string; tone: ChipTone; dot: string }> = {
  support_full: { label: "Support", tone: "yellow", dot: "bg-support" },
  support_light: { label: "Support light", tone: "aqua", dot: "bg-support-light" },
  feature: { label: "Product", tone: "lilac", dot: "bg-product" },
};

/** The text of the pipeline pill on a card: the pipeline and the sub-type, for example "Support · Bug". */
export function pipelineChipText(row: { pipelineKey: string; pipelineLabel: string; subType: "bug" | "task" | null }): string {
  const base = PIPELINE_STYLE[row.pipelineKey]?.label ?? row.pipelineLabel;
  if (!row.subType) return base;
  return `${base} · ${row.subType === "bug" ? "Bug" : "Task"}`;
}
