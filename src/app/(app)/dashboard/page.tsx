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
  const loose = rows.filter((r) => r.hasLooseEnds).length;
  const statsLine =
    `${active} in flight` +
    (loose > 0 ? ` · ${loose} loose end${loose > 1 ? "s" : ""}` : "") +
    ` · ${rows.length - active} complete`;

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-7 pb-5 pt-[26px]">
      <div className="mb-[18px] flex flex-wrap items-baseline gap-4">
        <h1 className="font-serif text-[32px] font-medium tracking-tight">Ticket rows</h1>
        <span className="font-serif text-[15px] italic text-ink-muted">{statsLine}</span>

        <div className="ml-auto flex flex-wrap items-center gap-4">
          <label
            className={`flex items-center gap-[7px] text-xs text-ink-muted ${inspect ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            title={inspect ? "Forced on while inspecting a date range" : "Show rows whose final milestone is complete"}
          >
            <input
              type="checkbox"
              checked={effectiveShowCompleted}
              disabled={readOnly}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="accent-accent"
            />
            Show completed
          </label>

          {inspect ? (
            <span className="flex items-center gap-2 rounded-[7px] border border-accent bg-surface-2 px-2.5 py-1 font-serif text-xs italic text-accent">
              Inspecting {inspect.from} → {inspect.to} · read-only
              <button onClick={() => setInspect(null)} className="not-italic font-sans font-semibold hover:underline">
                Dismiss
              </button>
            </span>
          ) : (
            <form
              className="flex items-center gap-1.5"
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
                className="rounded-[7px] border border-edge bg-surface-2 px-1.5 py-1 text-xs text-ink-muted"
                aria-label="Inspect from"
              />
              <span className="text-ink-faint">→</span>
              <input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="rounded-[7px] border border-edge bg-surface-2 px-1.5 py-1 text-xs text-ink-muted"
                aria-label="Inspect to"
              />
              <button
                type="submit"
                disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                className="rounded-[7px] border border-edge px-2.5 py-1 text-xs text-ink-muted hover:border-edge-strong disabled:opacity-40"
              >
                Inspect
              </button>
            </form>
          )}
        </div>
      </div>

      <NewRowForm />

      <div className="flex flex-1 flex-col gap-2.5">
        {isLoading && (
          <p className="py-8 text-center font-serif text-base italic text-ink-faint">Loading…</p>
        )}
        {!isLoading && visibleRows.length === 0 && (
          <div className="rounded-xl border border-dashed border-edge-strong p-12 text-center font-serif text-base italic text-ink-faint">
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
