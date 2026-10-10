"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CompletedCards } from "@/components/completed-cards";
import Link from "next/link";
import { api, type AnalyticsData, type AnalyticsOrigin } from "@/lib/client-api";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/ui";
import {
  AlertIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  BoltIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  CopyIcon,
} from "@/components/icons";

/* Palette definitions matching Waypoint design system tokens */
const SERIES = {
  support_bug: { label: "Support · Bug", color: "var(--support)" },
  support_task: { label: "Support · Task", color: "var(--done)" },
  product: { label: "Product Feature", color: "var(--product)" },
} as const;

const STAGE_PALETTE = [
  "var(--accent)",
  "var(--support)",
  "var(--product)",
  "var(--support-light)",
  "var(--done)",
  "#d97706",
  "#7c3aed",
  "#059669",
];

const MILESTONE_LABELS: Record<string, string> = {
  triage: "Triage & Setup",
  development: "Development",
  staging: "Staging",
  qa_review: "QA & Review",
  prod_close: "Production & Close",
  resolution: "Resolution",
  closeout: "Close-out",
  definition: "Definition",
};

function formatMilestone(key: string | null): string {
  if (!key) return "Not started";
  return MILESTONE_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isoDaysAgo(days: number): string {
  // Local calendar date, NOT toISOString (UTC) — ensures today's completions are included correctly in user's timezone.
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const PRESETS = [
  { label: "7d", days: 6 },
  { label: "14d", days: 13 },
  { label: "30d", days: 29 },
  { label: "90d", days: 89 },
];

const ORIGIN_FILTERS: { key: AnalyticsOrigin; label: string }[] = [
  { key: "all", label: "All Work" },
  { key: "support_bug", label: "Support Bugs" },
  { key: "support_task", label: "Support Tasks" },
  { key: "product", label: "Product Features" },
];

function OriginPill({
  origin,
  subType,
}: {
  origin: "support" | "product";
  subType?: "bug" | "task" | null;
}) {
  if (origin === "product") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-product/30 bg-product/15 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-product">
        <span className="h-1.5 w-1.5 rounded-full bg-product" />
        Product
      </span>
    );
  }
  if (subType === "task") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-done/30 bg-done-soft px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-done">
        <span className="h-1.5 w-1.5 rounded-full bg-done" />
        Support · Task
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-support/30 bg-support/15 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-support">
      <span className="h-1.5 w-1.5 rounded-full bg-support" />
      Support · Bug
    </span>
  );
}

function generateStandupDigest(data: AnalyticsData): string {
  const bottleneck = data.stageDwellTimes.find((s) => s.isBottleneck);
  const deltaLeadTimeText =
    data.leadTime.deltaPct !== null
      ? data.leadTime.deltaPct < 0
        ? ` (${Math.abs(data.leadTime.deltaPct)}% faster vs prior period)`
        : ` (${data.leadTime.deltaPct}% slower vs prior period)`
      : "";

  const deltaVelocityText =
    data.velocity.deltaPct !== null
      ? data.velocity.deltaPct >= 0
        ? ` (+${data.velocity.deltaPct}% vs last period)`
        : ` (${data.velocity.deltaPct}% vs last period)`
      : "";

  const looseEndsRefs = data.discipline.looseEndsRefs;
  const looseEndsDisplay =
    looseEndsRefs.length > 5
      ? `${looseEndsRefs.slice(0, 5).join(", ")} (+${looseEndsRefs.length - 5} more)`
      : looseEndsRefs.join(", ");
  const looseEndsText =
    data.discipline.looseEndsCount > 0
      ? `${data.discipline.looseEndsCount} active (${looseEndsDisplay})`
      : "0 active (clean)";

  const filterLabel =
    data.filter.origin === "support_bug"
      ? " · Support Bugs"
      : data.filter.origin === "support_task"
        ? " · Support Tasks"
        : data.filter.origin === "product"
          ? " · Product Features"
          : "";

  return [
    `### 🧭 Waypoint Flow Intelligence Digest (${data.range.from} → ${data.range.to}${filterLabel})`,
    `- **Cards Shipped:** ${data.velocity.completed}${deltaVelocityText}`,
    `  - Breakdown: ${data.breakdown.support_bug} Bugs · ${data.breakdown.support_task} Tasks · ${data.breakdown.product} Features`,
    `- **Mean Lead Time:** ${data.leadTime.avgDays !== null ? `${data.leadTime.avgDays}d (median ${data.leadTime.medianDays}d)` : "N/A"}${deltaLeadTimeText}`,
    `- **Active In-Flight WIP:** ${data.wip.total} cards (${data.wip.stalledCount} stalled ≥ 7d)`,
    `- **Active Bottleneck:** ${bottleneck ? `${bottleneck.label} (${bottleneck.avgDays}d avg · ${bottleneck.percentage}% of cycle time)` : "None identified"}`,
    `- **Verification Discipline:** ${data.discipline.subtaskVerificationRatePct}% verified · Loose ends: ${looseEndsText}`,
  ].join("\n");
}

export default function AnalyticsPage() {
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoDaysAgo(0));
  const [preset, setPreset] = useState("30d");
  const [origin, setOrigin] = useState<AnalyticsOrigin>("all");
  const [copied, setCopied] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics", from, to, origin],
    queryFn: () => api.analytics(from, to, origin),
  });

  const maxCount = Math.max(1, ...(data?.throughput.map((t) => t.count) ?? [1]));
  const breakdownTotal = data?.breakdown.total ?? 0;
  const bottleneckStage = data?.stageDwellTimes.find((s) => s.isBottleneck);

  const handleCopyDigest = async () => {
    if (!data) return;
    const text = generateStandupDigest(data);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error("Failed to copy digest to clipboard:", err);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        icon={<ChartIcon />}
        title="Analytics"
        subtitle="Flow metrics, lead time & delivery intelligence"
        actions={
          <>
            {/* Date presets */}
            <div role="group" aria-label="Date range presets" className="flex items-center gap-1 rounded-full bg-surface p-1">
              {PRESETS.map((p) => {
                const on = preset === p.label;
                return (
                  <button
                    key={p.label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setPreset(p.label);
                      setFrom(isoDaysAgo(p.days));
                      setTo(isoDaysAgo(0));
                    }}
                    className={`h-9 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
                      on ? "bg-accent text-accent-ink" : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Single date range picker popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                aria-expanded={showDatePicker}
                className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 font-mono text-xs transition-colors ${
                  showDatePicker || preset === ""
                    ? "bg-accent-soft text-accent-fg ring-1 ring-accent/40"
                    : "bg-surface text-ink hover:bg-surface-2"
                }`}
              >
                <CalendarIcon className="h-4 w-4 text-accent-fg" />
                <span>{from} → {to}</span>
              </button>

              {showDatePicker && (
                <div className="absolute right-0 top-full z-40 mt-2 w-72 max-w-[calc(100vw-24px)] animate-fade-in rounded-2xl border border-edge bg-surface p-4 text-xs text-ink shadow-pop">
                  <div className="mb-3 flex items-center justify-between border-b border-edge/60 pb-2">
                    <span className="text-[13px] font-semibold text-ink">Select Date Range</span>
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(false)}
                      aria-label="Close"
                      className="grid h-7 w-7 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <DateRangePicker
                    value={{ from, to }}
                    onApply={(range) => {
                      setFrom(range.from);
                      setTo(range.to);
                      setPreset("");
                      setShowDatePicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </>
        }
      />

      {/* Work type filter */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-4 sm:px-6">
        <div role="group" aria-label="Filter by work type" className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-surface p-1">
          {ORIGIN_FILTERS.map((f) => {
            const active = origin === f.key;
            const activeTone =
              f.key === "support_bug"
                ? "bg-chip-yellow text-chip-ink"
                : f.key === "support_task"
                  ? "bg-chip-mint text-chip-ink"
                  : f.key === "product"
                    ? "bg-chip-lilac text-chip-ink"
                    : "bg-accent text-accent-ink";
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => setOrigin(f.key)}
                className={`h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors ${
                  active ? activeTone : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-ink-faint">Changes compare with the previous equal period.</span>
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
      {isLoading && (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-ink-muted">
            Crunching flow metrics &amp; delivery intelligence…
          </p>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-center text-danger text-sm">
          Failed to load analytics data. Please check your network and try again.
        </div>
      )}

      {data && !isLoading && (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* TIER 1: EXECUTIVE KPI SCORECARDS GRID (4 Cards)                           */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            {/* Card 1: Cards Shipped (Velocity) */}
            <section className="rounded-xl border border-edge bg-surface p-5 shadow-card flex flex-col justify-between">
              <div>
                <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Cards Shipped
                </h2>
                <p className="mt-2 font-serif text-[44px] sm:text-[48px] font-medium leading-none tabular-nums text-ink">
                  {data.velocity.completed}
                </p>
                <div className="mt-2.5 text-[12.5px]">
                  {data.velocity.deltaPct === null ? (
                    <span className="text-ink-faint text-xs">no completions in previous period</span>
                  ) : (
                    <span
                      className={`font-semibold ${
                        data.velocity.deltaPct >= 0 ? "text-done" : "text-danger"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {data.velocity.deltaPct >= 0 ? <ArrowUpIcon className="h-3.5 w-3.5" /> : <ArrowDownIcon className="h-3.5 w-3.5" />}
                        {Math.abs(data.velocity.deltaPct)}%
                      </span>{" "}
                      <span className="font-normal text-ink-muted text-xs">
                        vs {data.velocity.previous} last period
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-edge/60 pt-2.5 font-mono text-[11px] text-ink-muted flex items-center justify-between">
                <span>Completed in range</span>
                <span className="tabular-nums">
                  {data.breakdown.support_bug}B · {data.breakdown.support_task}T · {data.breakdown.product}P
                </span>
              </div>
            </section>

            {/* Card 2: Mean Lead Time (Cycle Time) */}
            <section className="rounded-xl border border-edge bg-surface p-5 shadow-card flex flex-col justify-between">
              <div>
                <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Mean Lead Time
                </h2>
                <p className="mt-2 font-serif text-[44px] sm:text-[48px] font-medium leading-none tabular-nums text-ink">
                  {data.leadTime.avgDays !== null ? `${data.leadTime.avgDays}d` : "—"}
                </p>
                <div className="mt-2.5 text-[12.5px]">
                  {data.leadTime.avgDays === null ? (
                    <span className="text-ink-faint text-xs">no shipped cards in range</span>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-ink-muted">
                        Median: <span className="font-semibold text-ink">{data.leadTime.medianDays}d</span>
                      </span>
                      {data.leadTime.deltaPct !== null && (
                        <span
                          className={`font-semibold text-xs ${
                            data.leadTime.deltaPct < 0 ? "text-done" : "text-danger"
                          }`}
                        >
                          <span className="inline-flex items-center gap-0.5 align-middle">
                            {data.leadTime.deltaPct < 0 ? <ArrowDownIcon className="h-3 w-3" /> : <ArrowUpIcon className="h-3 w-3" />}
                            {Math.abs(data.leadTime.deltaPct)}%
                          </span>{" "}
                          <span className="font-normal text-ink-muted">
                            {data.leadTime.deltaPct < 0 ? "faster" : "slower"}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-edge/60 pt-2.5 text-[11px] font-mono text-ink-muted">
                {data.leadTime.fastest && data.leadTime.slowest ? (
                  <div className="flex items-center justify-between gap-1 truncate">
                    <span className="flex items-center gap-1 truncate text-done" title={`Fastest: ${data.leadTime.fastest.ref}`}>
                      <BoltIcon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{data.leadTime.fastest.ref} ({data.leadTime.fastest.days}d)</span>
                    </span>
                    <span className="text-ink-faint shrink-0">·</span>
                    <span className="flex items-center gap-1 truncate text-warn" title={`Slowest: ${data.leadTime.slowest.ref}`}>
                      <ClockIcon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{data.leadTime.slowest.ref} ({data.leadTime.slowest.days}d)</span>
                    </span>
                  </div>
                ) : (
                  <span className="text-ink-faint">Intake to production closeout</span>
                )}
              </div>
            </section>

            {/* Card 3: Active WIP & Aging */}
            <section className="rounded-xl border border-edge bg-surface p-5 shadow-card flex flex-col justify-between">
              <div>
                <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  In-Flight WIP &amp; Aging
                </h2>
                <p className="mt-2 font-serif text-[44px] sm:text-[48px] font-medium leading-none tabular-nums text-ink">
                  {data.wip.total}
                </p>
                <div className="mt-2.5 text-[12.5px]">
                  {data.wip.stalledCount > 0 ? (
<span className="inline-flex items-center gap-1.5 rounded-full bg-warn/15 px-2.5 py-1 text-xs font-semibold text-warn">
                      <AlertIcon className="h-3.5 w-3.5" />
                      {data.wip.stalledCount} aging &ge; 7d
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-done font-medium">
                      <CheckIcon className="h-3.5 w-3.5" />
                      Flow healthy (0 stalled)
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-edge/60 pt-2.5 text-xs text-ink-muted flex items-center justify-between">
                <span>Active cards in flight</span>
                <span className="font-mono text-[11px] text-ink-faint">
                  {data.wip.agingList.filter((a) => !a.isStalled).length} on pace
                </span>
              </div>
            </section>

            {/* Card 4: Verification Discipline */}
            <section className="rounded-xl border border-edge bg-surface p-5 shadow-card flex flex-col justify-between">
              <div>
                <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Verification Discipline
                </h2>
                <p className="mt-2 font-serif text-[44px] sm:text-[48px] font-medium leading-none tabular-nums text-ink">
                  {data.discipline.subtaskVerificationRatePct}%
                </p>
                <div className="mt-2.5 text-[12.5px]">
                  {data.discipline.looseEndsCount > 0 ? (
<span className="inline-flex items-center gap-1.5 text-warn text-xs font-semibold">
                      <AlertIcon className="h-3.5 w-3.5" />
                      {data.discipline.looseEndsCount} loose end
                      {data.discipline.looseEndsCount > 1 ? "s" : ""} active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-done text-xs font-medium">
                      <CheckIcon className="h-3.5 w-3.5" />
                      100% clean closeouts
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-edge/60 pt-2.5">
                {data.discipline.looseEndsRefs.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {data.discipline.looseEndsRefs.slice(0, 3).map((r) => (
                      <Link
                        key={r}
                        href="#completed-cards"
                        className="rounded-full bg-warn/15 px-2.5 py-0.5 font-mono text-[10.5px] text-warn transition-colors hover:bg-warn/25"
                        title="See it in Completed cards"
                      >
                        {r}
                      </Link>
                    ))}
                    {data.discipline.looseEndsRefs.length > 3 && (
                      <span className="text-[10px] text-ink-faint">
                        +{data.discipline.looseEndsRefs.length - 3} more
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-ink-faint">
                    Subtasks verified before release
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* ========================================================================= */}
          {/* TIER 2: FLOW DIAGNOSTICS & VISUALIZATIONS                                 */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            {/* Milestone Dwell Times & Bottleneck Radar (2 cols on large) */}
            <section className="rounded-xl border border-edge bg-surface p-5 shadow-card lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-edge/60 pb-3">
                <div>
                  <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    Milestone Bottleneck &amp; Dwell Times
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Average dwell time spent in each pipeline milestone
                  </p>
                </div>
                {bottleneckStage && (
                  <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-warn/15 px-3 py-1 text-xs font-semibold text-warn">
                    <span className="h-2 w-2 rounded-full bg-warn animate-pulse" />
                    Bottleneck: {bottleneckStage.label} ({bottleneckStage.avgDays}d)
                  </span>
                )}
              </div>

              {data.stageDwellTimes.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-faint">
                  No completed cards with milestone history in this range.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Proportional Segmented Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex h-4 w-full rounded-full overflow-hidden bg-surface-3 p-0.5 gap-0.5">
                      {data.stageDwellTimes.map((s, idx) => {
                        const color = STAGE_PALETTE[idx % STAGE_PALETTE.length];
                        return (
                          <div
                            key={s.milestoneKey}
                            style={{
                              width: `${Math.max(s.percentage, 3)}%`,
                              background: color,
                            }}
                            className={`h-full rounded-xs transition-all duration-300 relative group/stage ${
                              s.isBottleneck ? "ring-1 ring-warn ring-offset-1" : ""
                            }`}
                            title={`${s.label}: ${s.avgDays}d (${s.avgHours}h) · ${s.percentage}%`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-ink-faint">
                      <span>Pipeline Intake</span>
                      <span>Production Deploy</span>
                    </div>
                  </div>

                  {/* Stage Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
                    {data.stageDwellTimes.map((s, idx) => {
                      const color = STAGE_PALETTE[idx % STAGE_PALETTE.length];
                      return (
                        <div
                          key={s.milestoneKey}
                          className={`rounded-xl border p-3 flex flex-col justify-between transition-colors ${
                            s.isBottleneck
                              ? "border-warn/60 bg-warn/10 shadow-xs"
                              : "border-edge bg-surface-2"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-ink truncate">
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ background: color }}
                              />
                              <span className="truncate" title={s.label}>
                                {s.label}
                              </span>
                            </span>
                            {s.isBottleneck && (
                              <span className="shrink-0 rounded-full bg-chip-orange px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-chip-ink">
                                Peak
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="font-serif text-lg font-semibold tabular-nums text-ink">
                              {s.avgDays}d
                            </span>
                            <span className="font-mono text-[11px] text-ink-muted">
                              {s.percentage}%
                            </span>
                          </div>
                          <span className="text-[10px] text-ink-faint font-mono mt-0.5">
                            {s.avgHours} hrs avg
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Completions by Origin Breakdown (1 col) */}
            <section className="rounded-xl border border-edge bg-surface p-5 shadow-card space-y-4">
              <div className="border-b border-edge/60 pb-3">
                <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Completions by Origin
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Breakdown across support tasks, bugs &amp; features
                </p>
              </div>

              {breakdownTotal === 0 ? (
                <p className="py-8 text-center text-sm text-ink-faint">
                  Nothing completed in this range.
                </p>
              ) : (
                <ul className="flex flex-col gap-3.5">
                  {(Object.keys(SERIES) as (keyof typeof SERIES)[]).map((k) => {
                    const v = data.breakdown[k];
                    const pct = breakdownTotal > 0 ? Math.round((v / breakdownTotal) * 100) : 0;
                    return (
                      <li key={k} className="text-xs">
                        <div className="mb-1.5 flex justify-between items-center text-ink-muted">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span
                              aria-hidden
                              className="inline-block h-2.5 w-2.5 rounded-xs"
                              style={{ background: SERIES[k].color }}
                            />
                            <span className="text-ink">{SERIES[k].label}</span>
                          </span>
                          <span className="tabular-nums font-mono text-ink font-semibold">
                            {v} <span className="text-ink-faint font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%`, background: SERIES[k].color }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Throughput & Velocity Trend Stacked Bar Chart — Full Width (Span 3) */}
            <section className="rounded-xl border border-edge bg-surface p-5 shadow-card lg:col-span-3 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-edge/60 pb-3">
                <div>
                  <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    Cards Completed per {data.range.bucket.toUpperCase()}
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Stacked completion throughput categorised by work stream
                  </p>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-3 font-mono text-[11px] text-ink-muted self-start sm:self-auto">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-xs" style={{ background: "var(--support)" }} />
                    Bugs
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-xs" style={{ background: "var(--done)" }} />
                    Tasks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-xs" style={{ background: "var(--product)" }} />
                    Features
                  </span>
                </div>
              </div>

              {/* Stacked Bars */}
              <div
                className="mt-4 flex h-[160px] items-end gap-[3px] sm:gap-1.5 pt-4"
                role="img"
                aria-label="Throughput stacked bar chart"
              >
                {data.throughput.map((t) => {
                  const barHeightPct = Math.max(
                    t.count > 0 ? 5 : 2,
                    (t.count / maxCount) * 100
                  );
                  const bugPct = t.count > 0 ? (t.supportBugCount / t.count) * 100 : 0;
                  const taskPct = t.count > 0 ? (t.supportTaskCount / t.count) * 100 : 0;
                  const prodPct = t.count > 0 ? (t.productCount / t.count) * 100 : 0;

                  return (
                    <div
                      key={t.bucket}
                      className="group relative flex h-full flex-1 flex-col justify-end items-center"
                    >
                      {t.count > 0 ? (
                        <div
                          className="w-full flex flex-col justify-end overflow-hidden rounded-t-[3px] transition-all group-hover:brightness-110"
                          style={{ height: `${barHeightPct}%` }}
                        >
                          {t.productCount > 0 && (
                            <div
                              style={{
                                height: `${prodPct}%`,
                                background: "var(--product)",
                              }}
                            />
                          )}
                          {t.supportTaskCount > 0 && (
                            <div
                              style={{
                                height: `${taskPct}%`,
                                background: "var(--done)",
                              }}
                            />
                          )}
                          {t.supportBugCount > 0 && (
                            <div
                              style={{
                                height: `${bugPct}%`,
                                background: "var(--support)",
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div
                          className="w-full rounded-t-[2px]"
                          style={{ height: "2.5px", background: "var(--surface3)" }}
                        />
                      )}

                      {/* Tooltip on Hover */}
                      <div className="pointer-events-none absolute -top-16 left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-edge bg-surface-2 px-3 py-2 shadow-pop text-[11px] group-hover:flex flex-col gap-0.5 text-ink">
                        <div className="font-mono font-semibold text-accent-fg">{t.bucket}</div>
                        <div className="text-ink-muted">
                          <span className="font-semibold text-ink">{t.count}</span> completed
                        </div>
                        {t.count > 0 && (
                          <div className="flex items-center gap-2 text-[10.5px] font-mono">
                            <span className="text-support">{t.supportBugCount} Bug</span>
                            <span>·</span>
                            <span className="text-done">{t.supportTaskCount} Task</span>
                            <span>·</span>
                            <span className="text-product">{t.productCount} Feat</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X Axis labels */}
              <div className="mt-1 flex justify-between font-mono text-[10.5px] text-ink-faint">
                <span>{data.throughput[0]?.bucket}</span>
                {data.throughput.length > 2 && (
                  <span>{data.throughput[Math.floor(data.throughput.length / 2)]?.bucket}</span>
                )}
                <span>{data.throughput[data.throughput.length - 1]?.bucket}</span>
              </div>

              {/* Collapsible Granular Table View */}
              <details className="mt-3 rounded-xl border border-edge bg-surface-2/60 p-4 text-xs text-ink-muted group">
                <summary className="cursor-pointer font-medium text-ink hover:text-accent-fg select-none">
                  Granular Table View ({data.throughput.filter((t) => t.count > 0).length} active intervals)
                </summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-edge text-[10.5px] font-mono uppercase text-ink-faint">
                        <th className="pb-2 pr-4 font-normal">Interval ({data.range.bucket})</th>
                        <th className="pb-2 pr-4 font-normal">Total</th>
                        <th className="pb-2 pr-4 font-normal text-support">Support Bug</th>
                        <th className="pb-2 pr-4 font-normal text-done">Support Task</th>
                        <th className="pb-2 font-normal text-product">Product Feature</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-edge/40">
                      {data.throughput
                        .filter((t) => t.count > 0)
                        .map((t) => (
                          <tr key={t.bucket} className="hover:bg-surface-2">
                            <td className="py-2 pr-4 font-mono text-ink">{t.bucket}</td>
                            <td className="py-2 pr-4 font-semibold tabular-nums text-ink">{t.count}</td>
                            <td className="py-2 pr-4 tabular-nums text-support font-mono">{t.supportBugCount}</td>
                            <td className="py-2 pr-4 tabular-nums text-done font-mono">{t.supportTaskCount}</td>
                            <td className="py-2 tabular-nums text-product font-mono">{t.productCount}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
          </div>

          {/* ========================================================================= */}
          {/* TIER 3: STANDUP & EXECUTIVE DIGEST SECTION                                */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            {/* In-Flight Aging Watchlist (2 cols on large) */}
            <section className="rounded-xl border border-edge bg-surface p-5 shadow-card lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-edge/60 pb-3">
                <div>
                  <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    In-Flight Aging Watchlist
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Active work in progress sorted by cycle age
                  </p>
                </div>
                <span className="text-xs font-mono text-ink-faint">
                  {data.wip.agingList.length} cards tracked
                </span>
              </div>

              {data.wip.agingList.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-faint">
                  No active cards currently in flight.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-edge text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">
                        <th className="pb-2.5 font-medium">Card Ref</th>
                        <th className="pb-2.5 font-medium">Type</th>
                        <th className="pb-2.5 font-medium">Current Milestone</th>
                        <th className="pb-2.5 font-medium">Cycle Age</th>
                        <th className="pb-2.5 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-edge/50">
                      {data.wip.agingList.map((item) => (
                        <tr
                          key={item.identityRef}
                          className="hover:bg-surface-2/60 transition-colors"
                        >
                          <td className="py-2.5 pr-3">
                            <Link
                              href="/board"
                              className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-accent-fg hover:underline"
                              title="Open the Board"
                            >
                              {item.identityRef}
                              <ArrowUpRightIcon className="h-3 w-3 opacity-70" />
                            </Link>
                          </td>
                          <td className="py-2.5 pr-3">
                            <OriginPill origin={item.origin} subType={item.subType} />
                          </td>
                          <td className="py-2.5 pr-3 font-medium text-ink-muted">
                            {formatMilestone(item.currentMilestone)}
                          </td>
                          <td className="py-2.5 pr-3 font-mono tabular-nums text-ink font-semibold">
                            {item.ageDays}d
                          </td>
                          <td className="py-2.5 text-right">
                            {item.isStalled ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-warn/15 px-2.5 py-0.5 text-[10.5px] font-semibold text-warn">
                                <span className="h-1.5 w-1.5 rounded-full bg-warn animate-pulse" />
                                Stalled (&ge; 7d)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-0.5 text-[10.5px] font-medium text-ink-muted">
                                Active
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Standup & Executive Digest Card (1 col) */}
            <section className="rounded-xl border border-edge bg-surface p-5 shadow-card flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="border-b border-edge/60 pb-3">
                  <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    Standup &amp; Executive Digest
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Crisp Markdown summary for async standups &amp; meetings
                  </p>
                </div>

                {/* Mini Preview Box */}
                <div className="rounded-xl bg-surface-2 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-ink">
                    <span className="font-medium">Shipped in Period:</span>
                    <span className="font-mono font-semibold">{data.velocity.completed} cards</span>
                  </div>
                  <div className="flex items-center justify-between text-ink">
                    <span className="font-medium">Mean Lead Time:</span>
                    <span className="font-mono font-semibold">
                      {data.leadTime.avgDays !== null ? `${data.leadTime.avgDays}d` : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-ink">
                    <span className="font-medium">Active WIP / Stalled:</span>
                    <span className="font-mono font-semibold">
                      {data.wip.total} / {data.wip.stalledCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-ink">
                    <span className="font-medium">Bottleneck:</span>
                    <span className="font-mono text-[11px] text-accent-fg truncate max-w-[130px]" title={bottleneckStage?.label ?? "None"}>
                      {bottleneckStage ? bottleneckStage.label : "None"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-ink">
                    <span className="font-medium">Discipline:</span>
                    <span className="font-mono font-semibold">
                      {data.discipline.subtaskVerificationRatePct}% verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Copy Action Button */}
              <button
                onClick={handleCopyDigest}
                className={`flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[13px] font-semibold transition ${
                  copied
                    ? "bg-done-soft text-done ring-1 ring-done/40"
                    : "bg-accent text-accent-ink hover:brightness-110 active:scale-[0.98]"
                }`}
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-4 w-4" />
                    <span>Copy Standup Digest</span>
                  </>
                )}
              </button>
            </section>
          </div>
        </div>
      )}

      <CompletedCards />
      </main>
    </div>
  );
}
