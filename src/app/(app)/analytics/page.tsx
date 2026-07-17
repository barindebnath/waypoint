"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/client-api";

/* Categorical colors validated for CVD + contrast on surface #12151c
   (dataviz six-checks): amber / aqua / violet. Single-series bars use blue. */
const SERIES = {
  support_bug: { label: "Support · Bug", color: "#c98500" },
  support_task: { label: "Support · Task", color: "#199e70" },
  product: { label: "Product", color: "#9085e9" },
} as const;
const BAR_COLOR = "#3987e5";

function isoDaysAgo(days: number): string {
  // Local calendar date, NOT toISOString (UTC) — an IST evening is already
  // "tomorrow" in UTC terms and would silently exclude today's completions.
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AnalyticsPage() {
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoDaysAgo(0));
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", from, to],
    queryFn: () => api.analytics(from, to),
  });

  const maxCount = Math.max(1, ...(data?.throughput.map((t) => t.count) ?? [1]));
  const breakdownTotal = data
    ? data.breakdown.support_bug + data.breakdown.support_task + data.breakdown.product
    : 0;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8">
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 py-3 text-xs">
        <h1 className="mr-2 text-base font-semibold">Analytics</h1>
        {[
          { label: "7d", days: 6 },
          { label: "30d", days: 29 },
          { label: "90d", days: 89 },
        ].map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setFrom(isoDaysAgo(p.days));
              setTo(isoDaysAgo(0));
            }}
            className="rounded border border-edge px-2 py-1 text-ink-muted hover:bg-surface-2"
          >
            {p.label}
          </button>
        ))}
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded border border-edge bg-surface-2 px-1.5 py-1"
          aria-label="From"
        />
        <span className="text-ink-faint">→</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => setTo(e.target.value)}
          className="rounded border border-edge bg-surface-2 px-1.5 py-1"
          aria-label="To"
        />
        <span className="ml-auto text-ink-faint">
          vs previous {data ? `${data.range.from} − ${data.range.to}` : ""} equal period
        </span>
      </div>

      {isLoading && <p className="py-16 text-center text-sm text-ink-faint">Crunching…</p>}

      {data && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Velocity hero tile */}
          <section className="rounded-lg border border-edge bg-surface p-4">
            <h2 className="text-xs uppercase tracking-wider text-ink-faint">Completed in range</h2>
            <p className="mt-1 text-4xl font-semibold tabular-nums">{data.velocity.completed}</p>
            <p className="mt-1 text-sm">
              {data.velocity.deltaPct === null ? (
                <span className="text-ink-faint">no completions in previous period</span>
              ) : (
                <span className={data.velocity.deltaPct >= 0 ? "text-done" : "text-danger"}>
                  {data.velocity.deltaPct >= 0 ? "▲" : "▼"} {Math.abs(data.velocity.deltaPct)}%{" "}
                  <span className="text-ink-muted">
                    vs {data.velocity.previous} last period
                  </span>
                </span>
              )}
            </p>
            <p className="mt-3 border-t border-edge pt-2 text-xs text-ink-muted">
              {data.wip} currently in flight
            </p>
          </section>

          {/* Loose ends tile */}
          <section className="rounded-lg border border-edge bg-surface p-4">
            <h2 className="text-xs uppercase tracking-wider text-ink-faint">Loose ends</h2>
            <p className={`mt-1 text-4xl font-semibold tabular-nums ${data.looseEnds.count > 0 ? "text-warn" : ""}`}>
              {data.looseEnds.count}
            </p>
            <p className="mt-1 text-xs text-ink-muted">complete rows with unchecked sub-tasks</p>
            {data.looseEnds.refs.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5 border-t border-edge pt-2">
                {data.looseEnds.refs.map((r) => (
                  <li key={r}>
                    <Link
                      href="/"
                      className="rounded-full border border-warn/40 px-2 py-0.5 font-mono text-xs text-warn hover:bg-surface-2"
                      title="Open dashboard"
                    >
                      {r}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Breakdown by origin & sub-type */}
          <section className="rounded-lg border border-edge bg-surface p-4">
            <h2 className="text-xs uppercase tracking-wider text-ink-faint">
              Completions by origin & sub-type
            </h2>
            {breakdownTotal === 0 ? (
              <p className="mt-4 text-sm text-ink-faint">Nothing completed in this range.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {(Object.keys(SERIES) as (keyof typeof SERIES)[]).map((k) => {
                  const v = data.breakdown[k];
                  return (
                    <li key={k} className="text-xs">
                      <div className="mb-0.5 flex justify-between text-ink-muted">
                        <span className="flex items-center gap-1.5">
                          <span
                            aria-hidden
                            className="inline-block h-2.5 w-2.5 rounded-sm"
                            style={{ background: SERIES[k].color }}
                          />
                          {SERIES[k].label}
                        </span>
                        <span className="tabular-nums text-ink">
                          {v} · {Math.round((v / breakdownTotal) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-sm bg-surface-3">
                        <div
                          className="h-full rounded-sm"
                          style={{ width: `${(v / breakdownTotal) * 100}%`, background: SERIES[k].color }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Throughput over time — full width */}
          <section className="rounded-lg border border-edge bg-surface p-4 md:col-span-3">
            <h2 className="text-xs uppercase tracking-wider text-ink-faint">
              Cards completed per {data.range.bucket}
            </h2>
            <div className="mt-3 flex h-40 items-end gap-[2px]" role="img" aria-label="Throughput bar chart">
              {data.throughput.map((t) => (
                <div key={t.bucket} className="group relative flex h-full flex-1 flex-col justify-end">
                  <div
                    className="rounded-t-[4px]"
                    style={{
                      height: `${(t.count / maxCount) * 100}%`,
                      minHeight: t.count > 0 ? 3 : 1,
                      background: t.count > 0 ? BAR_COLOR : "var(--color-surface-3)",
                    }}
                    title={`${t.bucket}: ${t.count}`}
                  />
                  {/* hover tooltip */}
                  <div className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded border border-edge bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink group-hover:block">
                    {t.bucket} · {t.count}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
              <span>{data.throughput[0]?.bucket}</span>
              <span>{data.throughput[data.throughput.length - 1]?.bucket}</span>
            </div>
            {/* Accessible table view */}
            <details className="mt-2 text-xs text-ink-muted">
              <summary className="cursor-pointer">Table view</summary>
              <table className="mt-1">
                <thead>
                  <tr className="text-left text-ink-faint">
                    <th className="pr-4 font-normal">{data.range.bucket}</th>
                    <th className="font-normal">completed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.throughput
                    .filter((t) => t.count > 0)
                    .map((t) => (
                      <tr key={t.bucket}>
                        <td className="pr-4 font-mono">{t.bucket}</td>
                        <td className="tabular-nums">{t.count}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </details>
          </section>
        </div>
      )}
    </main>
  );
}
