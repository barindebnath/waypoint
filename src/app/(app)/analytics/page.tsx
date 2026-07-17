"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/client-api";

/* Breakdown series follow the theme's origin colors; identity is carried by
   the label + count next to each bar, not color alone. */
const SERIES = {
  support_bug: { label: "Support · Bug", color: "var(--support)" },
  support_task: { label: "Support · Task", color: "var(--done)" },
  product: { label: "Product", color: "var(--product)" },
} as const;

function isoDaysAgo(days: number): string {
  // Local calendar date, NOT toISOString (UTC) — an IST evening is already
  // "tomorrow" in UTC terms and would silently exclude today's completions.
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const PRESETS = [
  { label: "7d", days: 6 },
  { label: "30d", days: 29 },
  { label: "90d", days: 89 },
];

export default function AnalyticsPage() {
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoDaysAgo(0));
  const [preset, setPreset] = useState("30d");
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", from, to],
    queryFn: () => api.analytics(from, to),
  });

  const maxCount = Math.max(1, ...(data?.throughput.map((t) => t.count) ?? [1]));
  const breakdownTotal = data
    ? data.breakdown.support_bug + data.breakdown.support_task + data.breakdown.product
    : 0;

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-7 pb-12 pt-[26px]">
      {/* Header + range chips */}
      <div className="mb-5 flex flex-wrap items-baseline gap-3">
        <h1 className="font-serif text-[32px] font-medium tracking-tight">Analytics</h1>
        <div className="ml-2 flex gap-1.5">
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
                className={`rounded-full border px-[13px] py-[5px] text-xs ${
                  on
                    ? "border-accent bg-[var(--accent-soft)] text-accent"
                    : "border-edge text-ink-muted hover:border-edge-strong"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <span className="flex items-center gap-1.5 text-xs text-ink-faint">
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => {
              setFrom(e.target.value);
              setPreset("");
            }}
            className="rounded-[7px] border border-edge bg-surface-2 px-1.5 py-1"
            aria-label="From"
          />
          →
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => {
              setTo(e.target.value);
              setPreset("");
            }}
            className="rounded-[7px] border border-edge bg-surface-2 px-1.5 py-1"
            aria-label="To"
          />
        </span>
        <span className="ml-auto font-serif text-[13px] italic text-ink-faint">
          vs the previous equal period
        </span>
      </div>

      {isLoading && (
        <p className="py-16 text-center font-serif text-base italic text-ink-faint">Crunching…</p>
      )}

      {data && (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {/* Velocity hero tile */}
          <section className="rounded-xl border border-edge bg-surface p-5 shadow-card">
            <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Completed in range
            </h2>
            <p className="mt-1.5 font-serif text-[58px] font-medium leading-none tabular-nums">
              {data.velocity.completed}
            </p>
            <p className="mt-2.5 text-[13px]">
              {data.velocity.deltaPct === null ? (
                <span className="text-ink-faint">no completions in previous period</span>
              ) : (
                <span className={data.velocity.deltaPct >= 0 ? "text-done" : "text-danger"}>
                  {data.velocity.deltaPct >= 0 ? "▲" : "▼"} {Math.abs(data.velocity.deltaPct)}%{" "}
                  <span className="text-ink-muted">vs {data.velocity.previous} last period</span>
                </span>
              )}
            </p>
            <p className="mt-3.5 border-t border-edge pt-2.5 font-serif text-xs italic text-ink-muted">
              {data.wip} currently in flight
            </p>
          </section>

          {/* Loose ends tile */}
          <section className="rounded-xl border border-edge bg-surface p-5 shadow-card">
            <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Loose ends
            </h2>
            <p
              className={`mt-1.5 font-serif text-[58px] font-medium leading-none tabular-nums ${
                data.looseEnds.count > 0 ? "text-warn" : ""
              }`}
            >
              {data.looseEnds.count}
            </p>
            <p className="mt-2.5 text-xs text-ink-muted">complete rows with unchecked sub-tasks</p>
            {data.looseEnds.refs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-edge pt-2.5">
                {data.looseEnds.refs.map((r) => (
                  <Link
                    key={r}
                    href="/dashboard"
                    className="rounded-full border border-warn px-2.5 py-[3px] font-mono text-[11px] !text-warn hover:bg-surface-2"
                    title="Open dashboard"
                  >
                    {r}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Breakdown by origin & sub-type */}
          <section className="rounded-xl border border-edge bg-surface p-5 shadow-card">
            <h2 className="mb-3.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Completions by origin &amp; sub-type
            </h2>
            {breakdownTotal === 0 ? (
              <p className="mt-4 font-serif text-sm italic text-ink-faint">
                Nothing completed in this range.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {(Object.keys(SERIES) as (keyof typeof SERIES)[]).map((k) => {
                  const v = data.breakdown[k];
                  return (
                    <li key={k} className="text-xs">
                      <div className="mb-1 flex justify-between text-ink-muted">
                        <span className="flex items-center gap-1.5">
                          <span
                            aria-hidden
                            className="inline-block h-[9px] w-[9px] rounded-sm"
                            style={{ background: SERIES[k].color }}
                          />
                          {SERIES[k].label}
                        </span>
                        <span className="tabular-nums text-ink">
                          {v} · {Math.round((v / breakdownTotal) * 100)}%
                        </span>
                      </div>
                      <div className="h-[7px] rounded bg-surface-3">
                        <div
                          className="h-full rounded"
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
          <section className="rounded-xl border border-edge bg-surface p-5 shadow-card md:col-span-3">
            <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Cards completed per {data.range.bucket}
            </h2>
            <div
              className="mt-4 flex h-[150px] items-end gap-[3px]"
              role="img"
              aria-label="Throughput bar chart"
            >
              {data.throughput.map((t) => (
                <div key={t.bucket} className="group relative flex h-full flex-1 flex-col justify-end">
                  <div
                    className="rounded-t-[3px]"
                    style={{
                      height: `${Math.max(t.count > 0 ? 3 : 1.5, (t.count / maxCount) * 100)}%`,
                      background: t.count > 0 ? "var(--accent)" : "var(--surface3)",
                    }}
                    title={`${t.bucket}: ${t.count}`}
                  />
                  <div className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded border border-edge bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink group-hover:block">
                    {t.bucket} · {t.count}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-ink-faint">
              <span>{data.throughput[0]?.bucket}</span>
              <span>{data.throughput[data.throughput.length - 1]?.bucket}</span>
            </div>
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
