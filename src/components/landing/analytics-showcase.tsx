"use client";

import { BarChart3Icon, CheckCircleIcon, SparklesIcon } from "./icons";

export function AnalyticsShowcase() {
  const STAGES = [
    { name: "Triage & Setup", time: "0.3d", percent: 15, color: "bg-amber-500/80" },
    { name: "Development", time: "1.1d", percent: 50, color: "bg-accent" },
    { name: "Staging", time: "0.4d", percent: 18, color: "bg-blue-500/80" },
    { name: "QA & Review", time: "0.3d", percent: 17, color: "bg-purple-500/80" },
  ];

  return (
    <div className="w-full rounded-2xl border border-edge bg-surface p-5 sm:p-7 shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-edge pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4 text-accent" />
            <h3 className="font-serif text-base font-semibold text-ink">
              Velocity, Cycle Times & Loose Ends Radar
            </h3>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Real-time flow metrics without micro-management or artificial estimations.
          </p>
        </div>

        <span className="font-mono text-xs text-done bg-done-soft px-2.5 py-1 rounded-md border border-done/20">
          +28% throughput velocity
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-xl border border-edge bg-surface-2 p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Throughput</div>
          <div className="mt-1 font-serif text-2xl font-semibold text-ink">14 Cards</div>
          <div className="mt-1 text-xs text-done font-medium">Shipped in last 14 days</div>
        </div>

        <div className="rounded-xl border border-edge bg-surface-2 p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Mean Cycle Time</div>
          <div className="mt-1 font-serif text-2xl font-semibold text-ink">2.1 Days</div>
          <div className="mt-1 text-xs text-ink-muted">From card intake to production</div>
        </div>

        <div className="rounded-xl border border-edge bg-surface-2 p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Origin Breakdown</div>
          <div className="mt-1 font-serif text-2xl font-semibold text-ink">64% Bug / 36% Feat</div>
          <div className="mt-1 text-xs text-ink-muted">Zero untracked context shifts</div>
        </div>
      </div>

      {/* Cycle Time Breakdown Bar */}
      <div className="mt-5 rounded-xl border border-edge bg-surface-2 p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs font-serif font-semibold text-ink mb-3">
          <span>Milestone Cycle-Time Breakdown</span>
          <span className="font-mono text-ink-muted font-normal text-[11px]">Total: 2.1d avg</span>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="flex h-3.5 w-full rounded-full overflow-hidden bg-surface-3 p-0.5 gap-0.5">
          {STAGES.map((s) => (
            <div
              key={s.name}
              style={{ width: `${s.percent}%` }}
              className={`h-full rounded-xs ${s.color} transition-all duration-500`}
              title={`${s.name}: ${s.time}`}
            />
          ))}
        </div>

        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {STAGES.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className={`h-2 w-2 rounded-full ${s.color}`} />
              <span className="text-ink-muted truncate">{s.name}:</span>
              <span className="font-semibold text-ink">{s.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Loose Ends Radar Callout */}
      <div className="mt-5 rounded-xl border border-edge bg-surface-2 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warn" />
            <span className="font-serif text-xs font-semibold text-ink">Loose Ends Radar</span>
          </div>
          <p className="text-xs text-ink-muted">
            Highlights rows whose final milestone is done but carry unchecked sub-tasks (e.g. forgotten documentation or pending PR merge).
          </p>
        </div>
        <span className="whitespace-nowrap rounded-md border border-edge bg-surface px-2.5 py-1 font-mono text-xs text-ink">
          0 Loose Ends Active
        </span>
      </div>
    </div>
  );
}
