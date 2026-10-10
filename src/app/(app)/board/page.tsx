"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type EnrichedRowView } from "@/lib/client-api";
import { useAutoSync } from "@/lib/use-auto-sync";
import { BoardCard } from "@/components/board-card";
import { COLUMNS, columnIndex } from "@/lib/board-columns";
import { PIPELINE_STYLE } from "@/components/chip";
import {
  BoardIcon,
  CodeIcon,
  CompassIcon,
  FlagIcon,
  FlaskIcon,
  RefreshIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { TimesheetFooter } from "@/components/timesheet-footer";
import { NewRowForm } from "@/components/new-row-form";
import { PageHeader } from "@/components/ui";

function fmtSince(ms: number): string {
  const mins = Math.floor((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

/** Status of the background sync. Click to sync now. */
function SyncStatus() {
  const sync = useAutoSync();
  const [, setTick] = useState(0);

  // Update the relative time every 30 seconds.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const label = sync.isFetching
    ? "Syncing…"
    : sync.isError
      ? "Sync failed"
      : sync.dataUpdatedAt
        ? `Synced ${fmtSince(sync.dataUpdatedAt)}`
        : "Not synced";

  return (
    <button
      type="button"
      onClick={() => sync.refetch()}
      disabled={sync.isFetching}
      title={sync.isError ? `${sync.error.message} · click to retry` : "Jira, GitHub & Tempo sync automatically every 30 min · click to sync now"}
      aria-label={label}
      className={`inline-flex h-10 w-10 items-center justify-center gap-2 rounded-2xl bg-surface text-xs font-medium transition-colors hover:bg-surface-2 disabled:cursor-default sm:w-auto sm:px-3.5 ${
        sync.isError ? "text-danger" : "text-ink-muted hover:text-ink"
      }`}
    >
      <RefreshIcon className={`h-4 w-4 ${sync.isFetching ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/** The look of each Board column: an icon for the stage on a pastel tile. The order matches COLUMNS. */
const LANE_STYLE = [
  { icon: CompassIcon, tile: "bg-chip-sky" },
  { icon: CodeIcon, tile: "bg-chip-lilac" },
  { icon: FlaskIcon, tile: "bg-chip-yellow" },
  { icon: ShieldCheckIcon, tile: "bg-chip-orange" },
  { icon: FlagIcon, tile: "bg-chip-mint" },
];

type Filter = "all" | keyof typeof PIPELINE_STYLE;

/**
 * Board view: one column per milestone position.
 * The column grouping is in src/lib/board-columns.ts.
 * The page only reads `/api/v1/rows`; the engine stays the one source of logic.
 * Completed rows are not on the Board. Analytics lists them.
 */
export default function BoardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["rows"], queryFn: api.rows });
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: api.me });
  const [filter, setFilter] = useState<Filter>("all");
  const showTimesheet = me?.showTimesheet ?? true;

  const rows = data?.rows ?? [];
  const active = rows.filter((r) => !r.isComplete);
  const shown = filter === "all" ? active : active.filter((r) => r.pipelineKey === filter);
  const columns = COLUMNS.map((c) => ({ ...c, rows: [] as EnrichedRowView[] }));
  for (const r of shown) columns[columnIndex(r)].rows.push(r);

  const filters: { key: Filter; label: string; dot?: string; count: number }[] = [
    { key: "all", label: "All", count: active.length },
    ...Object.entries(PIPELINE_STYLE).map(([key, p]) => ({
      key,
      label: p.label,
      dot: p.dot,
      count: active.filter((r) => r.pipelineKey === key).length,
    })),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        icon={<BoardIcon />}
        title="Board"
        subtitle={isLoading ? "Loading…" : `${active.length} in flight`}
        actions={
          <>
            <SyncStatus />
            <NewRowForm />
          </>
        }
      >
        {/* Filter by pipeline */}
        <div role="group" aria-label="Filter by pipeline" className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-surface p-1">
          {filters.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f.key)}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
                  on ? "bg-accent text-accent-ink" : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {f.dot && <span className={`h-2 w-2 rounded-full ${f.dot}`} aria-hidden />}
                {f.label}
                <span className={`font-mono text-[11px] tabular-nums ${on ? "text-accent-ink/70" : "text-ink-faint"}`}>{f.count}</span>
              </button>
            );
          })}
        </div>
      </PageHeader>

      <main className="flex min-h-0 flex-1 flex-col gap-3 px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="min-h-0 flex-1 snap-x snap-proximity scroll-px-3 overflow-x-auto rounded-lane bg-lane p-3">
          <div className="grid h-full grid-flow-col auto-cols-[minmax(216px,1fr)] gap-3">
            {columns.map((col, i) => {
              const style = LANE_STYLE[i] ?? LANE_STYLE[0];
              return (
                <section key={col.title} aria-label={col.title} className="flex min-h-0 snap-start flex-col">
                  <header className="mb-3 flex min-h-9 items-center gap-2 px-1">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-[10px] text-chip-ink ${style.tile}`}>
                      <style.icon className="h-4 w-4" />
                    </span>
                    <h2 className="min-w-0 flex-1 text-[14px] font-semibold leading-tight tracking-tight">{col.title}</h2>
                    <span className="shrink-0 rounded-full bg-surface-3 px-2 py-0.5 font-mono text-[11px] tabular-nums text-ink-muted">
                      {isLoading ? "–" : col.rows.length}
                    </span>
                  </header>
                  <div className="-mr-1.5 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-1 pr-1.5">
                    {isLoading ? (
                      <>
                        <div className="h-32 animate-pulse rounded-card bg-card/60" />
                        <div className="h-24 animate-pulse rounded-card bg-card/40" />
                      </>
                    ) : (
                      <>
                        {col.rows.map((r) => (
                          <BoardCard key={r.id} row={r} />
                        ))}
                        {col.rows.length === 0 && (
                          <p className="rounded-card border border-dashed border-edge-strong/60 px-3 py-6 text-center text-[13px] text-ink-faint">
                            No cards here
                          </p>
                        )}
                        {/* New cards start in the first column, so the add row is only there. */}
                        {i === 0 && <NewRowForm variant="lane" />}
                      </>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {showTimesheet && <TimesheetFooter />}
      </main>
    </div>
  );
}
