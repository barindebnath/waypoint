"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type EnrichedRowView } from "@/lib/client-api";
import { BoardCard } from "@/components/board-card";

/**
 * Board view (Dashboard v2): one column per milestone position.
 *
 * Pipelines differ, so a column groups milestone keys by meaning, not by index.
 * Support-light skips Staging and QA: its Close-out lands in column 5.
 * The page only reads `/api/v1/rows`; the engine stays the one source of logic.
 */
const COLUMNS: { title: string; keys: string[] }[] = [
  { title: "Triage / Definition", keys: ["triage", "definition"] },
  { title: "Development", keys: ["development", "resolution"] },
  { title: "Staging", keys: ["staging"] },
  { title: "QA & Review", keys: ["qa_review"] },
  { title: "Production & Close-out", keys: ["prod_close", "closeout"] },
];

function columnIndex(row: EnrichedRowView): number {
  const idx = COLUMNS.findIndex((c) => c.keys.includes(row.currentMilestone));
  if (idx !== -1) return idx;
  // If a pipeline gets a new milestone key, place it by its position in the pipeline.
  const pos = row.milestones.findIndex((m) => m.key === row.currentMilestone);
  return Math.min(Math.max(pos, 0), COLUMNS.length - 1);
}

export default function BoardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["rows"], queryFn: api.rows });
  const [showDone, setShowDone] = useState(false);

  const rows = data?.rows ?? [];
  const active = rows.filter((r) => !r.isComplete);
  const done = rows.filter((r) => r.isComplete);
  const columns = COLUMNS.map((c) => ({ ...c, rows: [] as EnrichedRowView[] }));
  for (const r of active) columns[columnIndex(r)].rows.push(r);

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col px-3 sm:px-7 pb-5 pt-3 sm:pt-[26px]">
      <div className="mb-3 sm:mb-[18px] flex flex-row flex-wrap items-baseline gap-2.5 sm:gap-4">
        <h1 className="font-serif text-xl sm:text-[32px] font-medium tracking-tight">Board</h1>
        <span className="font-serif text-xs sm:text-[15px] italic text-ink-muted">
          {active.length} in flight · {done.length} done
        </span>
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

      {/* Done section: hidden by default */}
      {done.length > 0 && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowDone(!showDone)}
            aria-expanded={showDone}
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted hover:text-ink cursor-pointer"
          >
            <span className={`transition-transform ${showDone ? "rotate-90" : ""}`}>›</span>
            Done ({done.length})
          </button>
          {showDone && (
            <div className="mt-3 grid gap-2 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
              {done.map((r) => (
                <BoardCard key={r.id} row={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
