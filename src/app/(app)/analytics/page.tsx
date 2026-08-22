"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api, type AnalyticsData, type AnalyticsOrigin } from "@/lib/client-api";
import { DateRangePicker } from "@/components/date-range-picker";

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
    <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 sm:px-7 pb-16 pt-[26px]">
      {/* Header & Filter Controls */}
      <div className="mb-6 space-y-4 border-b border-edge/60 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1 className="font-serif text-[32px] font-medium tracking-tight text-ink">Analytics</h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Flow metrics, lead time &amp; delivery intelligence
            </p>
          </div>

          {/* Date Presets & Custom Pickers */}
          <div className="flex flex-col sm:items-end gap-2.5 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex gap-1.5 shrink-0">
                {PRESETS.map((p) => {
                  const on = preset === p.label;
                  return (
                    <button
                      key={p.label}
                      onClick={() => {
                        setPreset(p.label);
                        setFrom(isoDaysAgo(p.days));
                        setTo(isoDaysAgo(0));
                      }}
                      className={`rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors ${
                        on
                          ? "border-accent bg-[var(--accent-soft)] text-accent font-semibold shadow-xs"
                          : "border-edge text-ink-muted hover:border-edge-strong bg-surface"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Single Date Range Picker Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`rounded-[7px] border px-2.5 py-1 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showDatePicker || preset === ""
                      ? "border-accent bg-accent/10 text-accent font-semibold"
                      : "border-edge bg-surface-2 text-ink hover:border-edge-strong"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-3.5 h-3.5 text-accent">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  <span>{from} → {to}</span>
                </button>

                {showDatePicker && (
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-72 max-w-[calc(100vw-24px)] rounded-xl border border-edge bg-surface p-3.5 shadow-2xl text-xs text-ink animate-fade-in">
                    <div className="flex items-center justify-between border-b border-edge/60 pb-1.5 mb-2.5">
                      <span className="font-semibold text-xs text-ink">Select Date Range</span>
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="text-ink-faint hover:text-ink text-xs font-bold cursor-pointer"
                      >
                        ✕
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
            </div>
            <span className="font-serif text-[12px] italic text-ink-faint">
              vs the previous equal period
            </span>
          </div>
        </div>

        {/* Work Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] font-mono text-ink-faint uppercase tracking-wider mr-1">
            Filter:
          </span>
          {ORIGIN_FILTERS.map((f) => {
            const active = origin === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setOrigin(f.key)}
                className={`rounded-full border px-3 py-1 text-xs cursor-pointer whitespace-nowrap transition-all ${
                  active
                    ? f.key === "support_bug"
                      ? "border-support bg-support/15 text-support font-semibold shadow-xs"
                      : f.key === "support_task"
                        ? "border-done bg-done-soft text-done font-semibold shadow-xs"
                        : f.key === "product"
                          ? "border-product bg-product/15 text-product font-semibold shadow-xs"
                          : "border-accent bg-[var(--accent-soft)] text-accent font-semibold shadow-xs"
                    : "border-edge bg-surface text-ink-muted hover:border-edge-strong hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="font-serif text-base italic text-ink-muted">
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
                      {data.velocity.deltaPct >= 0 ? "▲" : "▼"} {Math.abs(data.velocity.deltaPct)}%{" "}
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
                          {data.leadTime.deltaPct < 0 ? "▼" : "▲"}{" "}
                          {Math.abs(data.leadTime.deltaPct)}%{" "}
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
                    <span className="text-done truncate" title={`Fastest: ${data.leadTime.fastest.ref}`}>
                      ⚡ {data.leadTime.fastest.ref} ({data.leadTime.fastest.days}d)
                    </span>
                    <span className="text-ink-faint shrink-0">·</span>
                    <span className="text-warn truncate" title={`Slowest: ${data.leadTime.slowest.ref}`}>
                      🐢 {data.leadTime.slowest.ref} ({data.leadTime.slowest.days}d)
                    </span>
                  </div>
                ) : (
                  <span className="font-serif italic text-ink-faint">Intake to production closeout</span>
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
                    <span className="inline-flex items-center gap-1 rounded-full border border-warn/40 bg-warn/10 px-2.5 py-0.5 text-xs font-semibold text-warn">
                      ⚠️ {data.wip.stalledCount} aging &ge; 7d
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-done font-medium">
                      ✓ Flow healthy (0 stalled)
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-edge/60 pt-2.5 font-serif text-xs italic text-ink-muted flex items-center justify-between">
                <span>Active cards in flight</span>
                <span className="font-mono text-[11px] not-italic text-ink-faint">
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
                    <span className="text-warn text-xs font-semibold">
                      ⚠️ {data.discipline.looseEndsCount} loose end
                      {data.discipline.looseEndsCount > 1 ? "s" : ""} active
                    </span>
                  ) : (
                    <span className="text-done text-xs font-medium">
                      ✓ 100% clean closeouts
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
                        href="/dashboard"
                        className="rounded-full border border-warn/40 bg-warn/10 px-2 py-[2px] font-mono text-[10px] text-warn hover:bg-warn/20 transition-colors"
                        title="Inspect on dashboard"
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
                  <p className="font-serif text-xs italic text-ink-faint">
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
                  <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full border border-warn/50 bg-warn/15 px-2.5 py-1 text-xs font-semibold text-warn">
                    <span className="h-2 w-2 rounded-full bg-warn animate-pulse" />
                    Bottleneck: {bottleneckStage.label} ({bottleneckStage.avgDays}d)
                  </span>
                )}
              </div>

              {data.stageDwellTimes.length === 0 ? (
                <p className="py-8 text-center font-serif text-sm italic text-ink-faint">
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
                          className={`rounded-lg border p-2.5 flex flex-col justify-between transition-colors ${
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
                              <span className="shrink-0 rounded px-1 py-[1px] text-[9px] font-bold uppercase tracking-wider bg-warn text-surface font-mono">
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
                <p className="py-8 text-center font-serif text-sm italic text-ink-faint">
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
                      <div className="pointer-events-none absolute -top-16 left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-edge bg-surface p-2 shadow-card text-[11px] group-hover:flex flex-col gap-0.5 text-ink">
                        <div className="font-mono font-semibold text-accent">{t.bucket}</div>
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
              <details className="mt-3 rounded-lg border border-edge bg-surface-2/40 p-3 text-xs text-ink-muted group">
                <summary className="cursor-pointer font-medium text-ink hover:text-accent select-none">
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
                <p className="py-8 text-center font-serif text-sm italic text-ink-faint">
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
                              href="/dashboard"
                              className="font-mono text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1"
                              title="Open in Dashboard"
                            >
                              {item.identityRef}
                              <span className="text-[10px] opacity-70">↗</span>
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
                              <span className="inline-flex items-center gap-1 rounded-full border border-warn/40 bg-warn/15 px-2 py-0.5 text-[10.5px] font-semibold text-warn">
                                <span className="h-1.5 w-1.5 rounded-full bg-warn animate-pulse" />
                                Stalled (&ge; 7d)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-edge bg-surface-2 px-2 py-0.5 text-[10.5px] font-medium text-ink-muted">
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
                <div className="rounded-lg border border-edge bg-surface-2 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-ink">
                    <span className="font-serif font-medium">Shipped in Period:</span>
                    <span className="font-mono font-semibold">{data.velocity.completed} cards</span>
                  </div>
                  <div className="flex items-center justify-between text-ink">
                    <span className="font-serif font-medium">Mean Lead Time:</span>
                    <span className="font-mono font-semibold">
                      {data.leadTime.avgDays !== null ? `${data.leadTime.avgDays}d` : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-ink">
                    <span className="font-serif font-medium">Active WIP / Stalled:</span>
                    <span className="font-mono font-semibold">
                      {data.wip.total} / {data.wip.stalledCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-ink">
                    <span className="font-serif font-medium">Bottleneck:</span>
                    <span className="font-mono text-[11px] text-accent truncate max-w-[130px]" title={bottleneckStage?.label ?? "None"}>
                      {bottleneckStage ? bottleneckStage.label : "None"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-ink">
                    <span className="font-serif font-medium">Discipline:</span>
                    <span className="font-mono font-semibold">
                      {data.discipline.subtaskVerificationRatePct}% verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Copy Action Button */}
              <button
                onClick={handleCopyDigest}
                className={`w-full rounded-lg border px-4 py-2.5 text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs ${
                  copied
                    ? "border-done bg-done-soft text-done"
                    : "border-accent bg-accent text-accent-ink hover:opacity-90"
                }`}
              >
                {copied ? (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    <span>Copy Standup Digest</span>
                  </>
                )}
              </button>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
