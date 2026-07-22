"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { rowTouchedInRange, type InspectRange } from "@/lib/inspect";
import { NewRowForm } from "@/components/new-row-form";
import { RowCard } from "@/components/row-card";
import { TimesheetFooter } from "@/components/timesheet-footer";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["rows"], queryFn: api.rows });
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: api.me });
  const queryClient = useQueryClient();

  // Global filter (spec §7): default OFF = completed hidden.
  const [showCompleted, setShowCompleted] = useState(false);

  // Date-range inspection (spec §8): read-only; filter forced ON and disabled.
  const [inspect, setInspect] = useState<InspectRange | null>(null);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const readOnly = inspect !== null;
  const effectiveShowCompleted = inspect ? true : showCompleted;

  const rows = data?.rows ?? [];
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [localRowIds, setLocalRowIds] = useState<string[]>([]);

  useEffect(() => {
    if (rows.length > 0 && !draggedId) {
      setLocalRowIds(rows.map((r) => r.id));
    }
  }, [rows, draggedId]);

  // Sort rows based on localRowIds order
  const sortedRows = [...rows].sort((a, b) => {
    const aIdx = localRowIds.indexOf(a.id);
    const bIdx = localRowIds.indexOf(b.id);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  const visibleRows = sortedRows.filter((row) => {
    if (inspect) return rowTouchedInRange(row, inspect);
    if (!effectiveShowCompleted && row.isComplete && !row.hasLooseEnds) return false;
    return true;
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (readOnly) return;
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("opacity-40");
  };

  const handleDragEnd = async (e: React.DragEvent) => {
    setDraggedId(null);
    e.currentTarget.classList.remove("opacity-40");

    // Optimistically update React Query cache with new order
    queryClient.setQueryData(["rows"], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        rows: sortedRows,
      };
    });

    try {
      await api.reorderRows(localRowIds);
    } catch (err) {
      console.error("Failed to save reordered ticket rows:", err);
      // Revert cache to trigger refetch / reset state
      queryClient.invalidateQueries({ queryKey: ["rows"] });
    }
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    if (readOnly || !draggedId || draggedId === targetId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const currentOrder = [...localRowIds];
    const fromIndex = currentOrder.indexOf(draggedId);
    const toIndex = currentOrder.indexOf(targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      currentOrder.splice(fromIndex, 1);
      currentOrder.splice(toIndex, 0, draggedId);
      setLocalRowIds(currentOrder);
    }
  };

  const active = rows.filter((r) => !r.isComplete).length;
  const loose = rows.filter((r) => r.hasLooseEnds).length;
  const statsLine =
    `${active} in flight` +
    (loose > 0 ? ` · ${loose} loose end${loose > 1 ? "s" : ""}` : "") +
    ` · ${rows.length - active} complete`;

  const showTimesheet = me?.showTimesheet ?? true;

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-3 sm:px-7 pb-5 pt-3 sm:pt-[26px]">
      <div className="mb-3 sm:mb-[18px] flex flex-col gap-2 sm:gap-4 md:flex-row md:items-baseline md:justify-between">
        <div className="flex flex-row items-baseline gap-2.5 sm:gap-4 flex-wrap">
          <h1 className="font-serif text-xl sm:text-[32px] font-medium tracking-tight">Ticket rows</h1>
          <span className="font-serif text-xs sm:text-[15px] italic text-ink-muted">{statsLine}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-4 md:ml-auto md:justify-end">
          <label
            className={`flex items-center gap-[7px] text-xs text-ink-muted shrink-0 ${inspect ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
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
            <span className="flex items-center gap-2 rounded-[7px] border border-accent bg-surface-2 px-2 py-0.5 sm:px-2.5 sm:py-1 font-serif text-[11px] sm:text-xs italic text-accent">
              Inspecting {inspect.from} → {inspect.to} · read-only
              <button onClick={() => setInspect(null)} className="not-italic font-sans font-semibold hover:underline">
                Dismiss
              </button>
            </span>
          ) : (
            <form
              className="flex items-center gap-1 sm:gap-1.5"
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
                className="w-[95px] sm:w-[130px] rounded-[7px] border border-edge bg-surface-2 px-1 py-0.5 text-[11px] sm:text-xs text-ink-muted"
                aria-label="Inspect from"
              />
              <span className="text-ink-faint text-xs">→</span>
              <input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="w-[95px] sm:w-[130px] rounded-[7px] border border-edge bg-surface-2 px-1 py-0.5 text-[11px] sm:text-xs text-ink-muted"
                aria-label="Inspect to"
              />
              <button
                type="submit"
                disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                className="rounded-[7px] border border-edge px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs text-ink-muted hover:border-edge-strong disabled:opacity-40 cursor-pointer"
              >
                Inspect
              </button>
            </form>
          )}
        </div>
      </div>

      <NewRowForm />

      <div
        className="flex flex-1 flex-col gap-2.5"
        onDragOver={(e) => {
          if (!readOnly && draggedId) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }
        }}
        onDrop={(e) => e.preventDefault()}
      >
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
          <div
            key={row.id}
            draggable={!readOnly}
            onDragStart={(e) => handleDragStart(e, row.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, row.id)}
            onDrop={(e) => e.preventDefault()}
            className="group relative transition-all duration-150"
          >
            {!readOnly && (
              <div
                title="Drag to reorder"
                className="absolute -left-6 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-ink-faint hover:text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity p-1.5 select-none"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="9" cy="5" r="2"/>
                  <circle cx="9" cy="12" r="2"/>
                  <circle cx="9" cy="19" r="2"/>
                  <circle cx="15" cy="5" r="2"/>
                  <circle cx="15" cy="12" r="2"/>
                  <circle cx="15" cy="19" r="2"/>
                </svg>
              </div>
            )}
            <RowCard row={row} readOnly={readOnly} inspect={inspect} />
          </div>
        ))}
      </div>

      {showTimesheet && (
        <TimesheetFooter showCompleted={effectiveShowCompleted} readOnly={readOnly} inspect={inspect} />
      )}
    </main>
  );
}
