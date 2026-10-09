"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type EnrichedRowView } from "@/lib/client-api";
import { useAutoSync } from "@/lib/use-auto-sync";
import { BoardCard } from "@/components/board-card";
import { COLUMNS, columnIndex } from "@/lib/board-columns";
import { DeferredSpinner } from "@/components/deferred-spinner";
import { TimesheetFooter } from "@/components/timesheet-footer";
import { NewRowForm } from "@/components/new-row-form";

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
      title={sync.isError ? `${sync.error.message} · click to retry` : "Jira, GitHub & Tempo sync automatically every 5 min · click to sync now"}
      className={`ml-auto flex items-center gap-1.5 font-mono text-[11px] cursor-pointer disabled:cursor-default ${
        sync.isError ? "text-danger" : "text-ink-faint hover:text-ink"
      }`}
    >
      <DeferredSpinner isPending={sync.isFetching} className="h-3 w-3 text-current" />
      {label}
    </button>
  );
}

/**
 * Board view: one column per milestone position.
 * The column grouping is in src/lib/board-columns.ts.
 * The page only reads `/api/v1/rows`; the engine stays the one source of logic.
 * Completed rows are not on the Board. Analytics lists them.
 */
export default function BoardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["rows"], queryFn: api.rows });
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: api.me });
  const showTimesheet = me?.showTimesheet ?? true;

  const rows = data?.rows ?? [];
  const active = rows.filter((r) => !r.isComplete);
  const columns = COLUMNS.map((c) => ({ ...c, rows: [] as EnrichedRowView[] }));
  for (const r of active) columns[columnIndex(r)].rows.push(r);

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col px-3 sm:px-7 pb-5 pt-3 sm:pt-[26px]">
      <div className="mb-3 sm:mb-[18px] flex flex-row flex-wrap items-baseline gap-2.5 sm:gap-4">
        <h1 className="font-serif text-xl sm:text-[32px] font-medium tracking-tight">Board</h1>
        <span className="font-serif text-xs sm:text-[15px] italic text-ink-muted">
          {active.length} in flight
        </span>
        <SyncStatus />
        <div className="self-center">
          <NewRowForm />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-3 overflow-x-auto pb-2">
          {columns.map((col) => (
            <section key={col.title} className="flex min-h-[200px] flex-col rounded-xl border border-edge bg-surface-2/60 p-2.5">
              <header className="mb-2.5 flex items-baseline justify-between px-1">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">{col.title}</h2>
                <span className="font-mono text-[11px] text-ink-faint">{col.rows.length}</span>
              </header>
              <div className="flex flex-col gap-2">
                {col.rows.map((r) => (
                  <BoardCard key={r.id} row={r} />
                ))}
                {col.rows.length === 0 && (
                  <p className="px-1 py-4 text-center font-serif text-xs italic text-ink-faint">Empty</p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {showTimesheet && (
        <>
          {/* The bar is fixed to the window bottom. This spacer keeps the last cards above its closed height. */}
          <div className="h-12 shrink-0" aria-hidden />
          <TimesheetFooter />
        </>
      )}
    </main>
  );
}
