"use client";

import { useState } from "react";
import { BarChart3Icon } from "./icons";

type OriginFilter = "all" | "bugs" | "features";

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
      { name: "Triage", time: "0.3d", percent: 15, color: "bg-amber-500" },
      { name: "Development", time: "1.1d", percent: 50, color: "bg-accent" },
      { name: "Staging", time: "0.4d", percent: 18, color: "bg-blue-500" },
      { name: "QA & Review", time: "0.3d", percent: 17, color: "bg-purple-500" },
    ],
  },
  bugs: {
    throughput: "9 Bugs",
    throughputSub: "Avg 1.6 days per fix",
    cycleTime: "1.6 Days",
    cycleTimeSub: "Triage to hotfix canary",
    split: "100% Support Bugs",
    stages: [
      { name: "Triage", time: "0.2d", percent: 12, color: "bg-amber-500" },
      { name: "Development", time: "0.8d", percent: 50, color: "bg-accent" },
      { name: "Staging", time: "0.4d", percent: 25, color: "bg-blue-500" },
      { name: "QA & Review", time: "0.2d", percent: 13, color: "bg-purple-500" },
    ],
  },
  features: {
    throughput: "5 Features",
    throughputSub: "Greenfield & enhancements",
    cycleTime: "3.2 Days",
    cycleTimeSub: "Spec definition to release",
    split: "100% Product Features",
    stages: [
      { name: "Definition", time: "0.5d", percent: 16, color: "bg-amber-500" },
      { name: "Development", time: "1.6d", percent: 50, color: "bg-accent" },
      { name: "Staging", time: "0.6d", percent: 19, color: "bg-blue-500" },
      { name: "QA & Review", time: "0.5d", percent: 15, color: "bg-purple-500" },
    ],
  },
};

export function AnalyticsShowcase() {
  const [filter, setFilter] = useState<OriginFilter>("all");
  const data = METRICS_DATA[filter];

  return (
    <div className="w-full rounded-2xl border border-edge bg-surface p-5 sm:p-6 shadow-card space-y-4">
      {/* Header with Origin Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-edge pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-semibold text-ink">
              Velocity, Cycle Times & Loose Ends
            </h3>
            <span className="font-mono text-xs text-done bg-done-soft px-2 py-0.5 rounded-md font-semibold">
              +28% velocity
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            High-signal flow metrics without story-point estimation theater.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-edge bg-surface-2 p-0.5 text-xs font-mono self-start sm:self-auto">
          {(["all", "bugs", "features"] as OriginFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-2.5 py-1 capitalize transition cursor-pointer ${
                filter === f
                  ? "bg-surface font-semibold text-accent shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {f === "all" ? "All Work" : f === "bugs" ? "Bugs Only" : "Features"}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-edge bg-surface-2 p-3.5">
          <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-muted">Throughput</div>
          <div className="mt-1 font-serif text-2xl font-semibold text-ink">{data.throughput}</div>
          <div className="mt-0.5 text-[11px] text-done font-medium">{data.throughputSub}</div>
        </div>

        <div className="rounded-xl border border-edge bg-surface-2 p-3.5">
          <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-muted">Mean Cycle Time</div>
          <div className="mt-1 font-serif text-2xl font-semibold text-ink">{data.cycleTime}</div>
          <div className="mt-0.5 text-[11px] text-ink-muted">{data.cycleTimeSub}</div>
        </div>

        <div className="rounded-xl border border-edge bg-surface-2 p-3.5">
          <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-muted">Origin Focus</div>
          <div className="mt-1 font-serif text-2xl font-semibold text-ink">{data.split}</div>
          <div className="mt-0.5 text-[11px] text-ink-muted">Zero untracked context shifts</div>
        </div>
      </div>

      {/* Cycle Time Bar Chart */}
      <div className="rounded-xl border border-edge bg-surface-2 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-serif font-semibold text-ink">
          <span>Milestone Cycle-Time Breakdown</span>
          <span className="font-mono text-ink-muted font-normal text-[11px]">
            {data.cycleTime} average total
          </span>
        </div>

        {/* Bar */}
        <div className="flex h-3 w-full rounded-full overflow-hidden bg-surface-3 p-0.5 gap-0.5">
          {data.stages.map((s) => (
            <div
              key={s.name}
              style={{ width: `${s.percent}%` }}
              className={`h-full rounded-xs ${s.color} transition-all duration-300`}
              title={`${s.name}: ${s.time}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {data.stages.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className={`h-2 w-2 rounded-full ${s.color}`} />
              <span className="text-ink-muted truncate">{s.name}:</span>
              <span className="font-semibold text-ink">{s.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Loose Ends Callout */}
      <div className="rounded-xl border border-edge bg-surface-2 p-3.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="font-serif font-semibold text-ink">Loose Ends Radar:</span>
          <span className="text-ink-muted hidden sm:inline">Catches unverified tasks on completed rows before release.</span>
        </div>
        <span className="rounded-md border border-edge bg-surface px-2 py-0.5 font-mono text-[11px] font-semibold text-done">
          0 Loose Ends Active
        </span>
      </div>
    </div>
  );
}
