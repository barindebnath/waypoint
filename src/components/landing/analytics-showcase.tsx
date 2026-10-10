"use client";

import { useState } from "react";
import { Chip } from "@/components/chip";
import { ChartIcon } from "@/components/icons";

type OriginFilter = "all" | "bugs" | "features";

/*
 * The colour of a stage is the colour of its column on the Board (sky, lilac, yellow, orange).
 * So a stage has the same colour on the Board and in the chart.
 */
const METRICS_DATA: Record<
  OriginFilter,
  {
    throughput: string;
    throughputSub: string;
    cycleTime: string;
    cycleTimeSub: string;
    split: string;
    stages: { name: string; time: string; percent: number; color: string }[];
  }
> = {
  all: {
    throughput: "14 Cards",
    throughputSub: "Shipped in last 14 days",
    cycleTime: "2.1 Days",
    cycleTimeSub: "Intake to production canary",
    split: "64% Bug / 36% Feat",
    stages: [
      { name: "Triage", time: "0.3d", percent: 15, color: "bg-chip-sky" },
      { name: "Development", time: "1.1d", percent: 50, color: "bg-chip-lilac" },
      { name: "Staging", time: "0.4d", percent: 18, color: "bg-chip-yellow" },
      { name: "QA & Review", time: "0.3d", percent: 17, color: "bg-chip-orange" },
    ],
  },
  bugs: {
    throughput: "9 Bugs",
    throughputSub: "Avg 1.6 days per fix",
    cycleTime: "1.6 Days",
    cycleTimeSub: "Triage to hotfix canary",
    split: "100% Support Bugs",
    stages: [
      { name: "Triage", time: "0.2d", percent: 12, color: "bg-chip-sky" },
      { name: "Development", time: "0.8d", percent: 50, color: "bg-chip-lilac" },
      { name: "Staging", time: "0.4d", percent: 25, color: "bg-chip-yellow" },
      { name: "QA & Review", time: "0.2d", percent: 13, color: "bg-chip-orange" },
    ],
  },
  features: {
    throughput: "5 Features",
    throughputSub: "Greenfield & enhancements",
    cycleTime: "3.2 Days",
    cycleTimeSub: "Spec definition to release",
    split: "100% Product Features",
    stages: [
      { name: "Definition", time: "0.5d", percent: 16, color: "bg-chip-sky" },
      { name: "Development", time: "1.6d", percent: 50, color: "bg-chip-lilac" },
      { name: "Staging", time: "0.6d", percent: 19, color: "bg-chip-yellow" },
      { name: "QA & Review", time: "0.5d", percent: 15, color: "bg-chip-orange" },
    ],
  },
};

const LABEL = "text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint";

export function AnalyticsShowcase() {
  const [filter, setFilter] = useState<OriginFilter>("all");
  const data = METRICS_DATA[filter];

  return (
    <div className="w-full space-y-3 rounded-3xl bg-surface p-4 sm:p-6">
      {/* Header with Origin Filter */}
      <div className="flex flex-col justify-between gap-3 pb-1 sm:flex-row sm:items-start">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-accent-fg">
            <ChartIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="font-serif text-lg font-semibold tracking-tight text-ink">
                Velocity, Cycle Times &amp; Loose Ends
              </h3>
              <Chip tone="mint">+28% velocity</Chip>
            </div>
            <p className="mt-1 text-[13px] text-ink-muted">
              High-signal flow metrics without story-point estimation theater.
            </p>
          </div>
        </div>

        {/* Filter Toggle */}
        <div role="group" aria-label="Filter by origin" className="flex shrink-0 items-center gap-1 self-start rounded-full bg-surface-2 p-1">
          {(["all", "bugs", "features"] as OriginFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`h-8 cursor-pointer rounded-full px-3.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-accent font-semibold text-accent-ink"
                  : "text-ink-muted hover:bg-surface-3 hover:text-ink"
              }`}
            >
              {f === "all" ? "All Work" : f === "bugs" ? "Bugs Only" : "Features"}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface-2 p-4">
          <div className={LABEL}>Throughput</div>
          <div className="mt-2 font-serif text-[26px] font-semibold leading-tight tracking-tight text-ink">{data.throughput}</div>
          <div className="mt-2 text-[12px] font-medium text-done">{data.throughputSub}</div>
        </div>

        <div className="rounded-2xl bg-surface-2 p-4">
          <div className={LABEL}>Mean Cycle Time</div>
          <div className="mt-2 font-serif text-[26px] font-semibold leading-tight tracking-tight text-ink">{data.cycleTime}</div>
          <div className="mt-2 text-[12px] text-ink-muted">{data.cycleTimeSub}</div>
        </div>

        <div className="rounded-2xl bg-surface-2 p-4">
          <div className={LABEL}>Origin Focus</div>
          <div className="mt-2 font-serif text-[26px] font-semibold leading-tight tracking-tight text-ink">{data.split}</div>
          <div className="mt-2 text-[12px] text-ink-muted">Zero untracked context shifts</div>
        </div>
      </div>

      {/* Cycle Time Bar Chart */}
      <div className="space-y-3.5 rounded-2xl bg-surface-2 p-4">
        <div className="flex items-center justify-between gap-3 text-[13px] font-semibold text-ink">
          <span>Milestone Cycle-Time Breakdown</span>
          <span className="font-mono text-[11px] font-normal text-ink-muted">
            {data.cycleTime} average total
          </span>
        </div>

        {/* Bar */}
        <div className="flex h-4 w-full gap-1 overflow-hidden rounded-full bg-surface-3 p-1">
          {data.stages.map((s) => (
            <div
              key={s.name}
              style={{ width: `${s.percent}%` }}
              className={`h-full rounded-full ${s.color} transition-all duration-300`}
              title={`${s.name}: ${s.time}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5 sm:grid-cols-4">
          {data.stages.map((s) => (
            <div key={s.name} className="flex items-center gap-2 font-mono text-[11px]">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.color}`} />
              <span className="truncate text-ink-muted">{s.name}:</span>
              <span className="font-semibold text-ink">{s.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Loose Ends Callout */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 p-4 text-[13px]">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
          <span className="font-semibold text-ink">Loose Ends Radar:</span>
          <span className="hidden truncate text-ink-muted sm:inline">Catches unverified tasks on completed rows before release.</span>
        </div>
        <Chip tone="mint" className="shrink-0 font-mono">0 Loose Ends Active</Chip>
      </div>
    </div>
  );
}
