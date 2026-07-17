"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { rowTouchedInRange, type InspectRange } from "@/lib/inspect";
import { NewRowForm } from "@/components/new-row-form";
import { RowCard } from "@/components/row-card";
import { TimesheetFooter } from "@/components/timesheet-footer";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["rows"], queryFn: api.rows });

  // Global filter (spec §7): default OFF = completed hidden.
  const [showCompleted, setShowCompleted] = useState(false);

  // Date-range inspection (spec §8): read-only; filter forced ON and disabled.
  const [inspect, setInspect] = useState<InspectRange | null>(null);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const readOnly = inspect !== null;
  const effectiveShowCompleted = inspect ? true : showCompleted;

  const rows = data?.rows ?? [];
  const visibleRows = rows.filter((row) => {
    if (inspect) return rowTouchedInRange(row, inspect);
    if (!effectiveShowCompleted && row.isComplete && !row.hasLooseEnds) return false;
    return true;
  });

  const active = rows.filter((r) => !r.isComplete).length;
  const looseEnds = rows.filter((r) => r.hasLooseEnds).length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-4">
      <div className="flex flex-wrap items-center gap-3 py-3">
        <NewRowForm />
        <div className="ml-auto flex items-center gap-3 text-xs text-ink-muted">
          <span>
            {active} in flight{looseEnds > 0 && <span className="text-warn"> · {looseEnds} loose ends</span>}
          </span>
          <label
            className={`flex items-center gap-1.5 ${inspect ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            title={inspect ? "Forced on while inspecting a date range" : "Show rows whose final milestone is complete"}
          >
            <input
              type="checkbox"
              checked={effectiveShowCompleted}
              disabled={readOnly}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="accent-live"
            />
            Show completed
          </label>

          {/* Date-range inspection controls */}
          {inspect ? (
            <span className="flex items-center gap-2 rounded border border-live/40 bg-live/10 px-2 py-1 text-live">
              Inspecting {inspect.from} → {inspect.to} · read-only
              <button onClick={() => setInspect(null)} className="font-semibold hover:underline">
                Dismiss
              </button>
            </span>
          ) : (
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (draftFrom && draftTo && draftFrom <= draftTo) {
                  setInspect({ from: draftFrom, to: draftTo });
                }
              }}
            >
              <input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="rounded border border-edge bg-surface-2 px-1.5 py-1 text-xs"
                aria-label="Inspect from"
              />
              <span className="text-ink-faint">→</span>
              <input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="rounded border border-edge bg-surface-2 px-1.5 py-1 text-xs"
                aria-label="Inspect to"
              />
              <button
                type="submit"
                disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                className="rounded border border-edge px-2 py-1 text-xs hover:bg-surface-2 disabled:opacity-40"
              >
                Inspect
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-1.5">
        {isLoading && <p className="py-8 text-center text-sm text-ink-faint">Loading…</p>}
        {!isLoading && visibleRows.length === 0 && (
          <div className="rounded-lg border border-dashed border-edge py-12 text-center text-sm text-ink-faint">
            {rows.length === 0
              ? "No rows yet. Add the card you just picked up — or let your AI do it via the API."
              : inspect
                ? "Nothing was touched in this date range."
                : "Everything is complete and tidy. Toggle “Show completed” to see finished rows."}
          </div>
        )}
        {visibleRows.map((row) => (
          <RowCard key={row.id} row={row} readOnly={readOnly} inspect={inspect} />
        ))}
      </div>

      <TimesheetFooter showCompleted={effectiveShowCompleted} readOnly={readOnly} inspect={inspect} />
    </main>
  );
}
