"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { rowTouchedInRange, type InspectRange } from "@/lib/inspect";
import { NewRowForm } from "@/components/new-row-form";
import { RowCard } from "@/components/row-card";
import { TimesheetFooter } from "@/components/timesheet-footer";
import { DeferredSpinner } from "@/components/deferred-spinner";
import { FilterIcon, RefreshIcon } from "@/components/status-badge";

export type SortOption = "custom" | "newest" | "oldest" | "longest_in_stage" | "recently_updated";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["rows"], queryFn: api.rows });
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: api.me });
  const queryClient = useQueryClient();

  // Global filter (spec §7): default OFF = completed hidden.
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("custom");
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const syncMut = useMutation({
    mutationFn: () => api.syncIntegrations(),
    onSuccess: (res) => {
      setSyncToast(`Synced ${res.syncedJiraCount} Jira & ${res.syncedGithubCount} GitHub PR(s) ✓`);
      queryClient.invalidateQueries({ queryKey: ["rows"] });
      setTimeout(() => setSyncToast(null), 4000);
    },
    onError: (err: Error) => {
      setSyncToast(`Sync failed: ${err.message}`);
      setTimeout(() => setSyncToast(null), 4000);
    },
  });

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

  const getActiveStageTime = (r: (typeof rows)[number]) => {
    const current = r.milestones.find((m) => m.isCurrent);
    return current ? new Date(current.updatedAt || current.createdAt).getTime() : new Date(r.updatedAt).getTime();
  };

  // Sort rows based on selected sort option
  const sortedRows = [...rows].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === "longest_in_stage") {
      return getActiveStageTime(a) - getActiveStageTime(b);
    }
    if (sortBy === "recently_updated") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    // Default: Custom order (drag & drop)
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
    if (sortBy !== "custom") {
      setSortBy("custom");
    }
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

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 ml-auto">
          {syncToast && (
            <span className="rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs text-accent font-medium animate-fade-in">
              {syncToast}
            </span>
          )}

          {/* Sync integrations shortcut button */}
          <button
            type="button"
            disabled={syncMut.isPending}
            onClick={() => syncMut.mutate()}
            className="rounded-[7px] border border-edge bg-surface-2 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-ink hover:border-edge-strong disabled:opacity-50 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Sync Jira status & GitHub PRs now"
          >
            <DeferredSpinner isPending={syncMut.isPending} className="h-3.5 w-3.5 text-current" />
            {!syncMut.isPending && <RefreshIcon className="h-3.5 w-3.5 text-ink-muted" />}
            <span className="hidden sm:inline">Sync Integrations</span>
            <span className="sm:hidden">Sync</span>
          </button>

          {/* Filter & Sort Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className={`rounded-[7px] border px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                showCompleted || sortBy !== "custom" || inspect !== null
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-edge bg-surface-2 text-ink hover:border-edge-strong"
              }`}
            >
              <FilterIcon className="h-3.5 w-3.5 text-ink-muted" />
              <span>Filter &amp; Sort</span>
              {(showCompleted || sortBy !== "custom" || inspect !== null) && (
                <span className="flex h-2 w-2 rounded-full bg-accent" />
              )}
            </button>

            {/* Popover Card */}
            {showFilterPopover && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-80 max-w-[calc(100vw-24px)] rounded-xl border border-edge bg-surface p-4 shadow-2xl text-xs text-ink">
                <div className="flex items-center justify-between border-b border-edge/60 pb-2 mb-3">
                  <span className="font-semibold text-sm">Display &amp; Filter</span>
                  <button
                    onClick={() => setShowFilterPopover(false)}
                    className="text-ink-faint hover:text-ink text-sm font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3.5">
                  {/* Sort order selection */}
                  <div>
                    <label className="block text-[11px] font-medium text-ink-muted mb-1">Sort order:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="w-full rounded-[7px] border border-edge bg-surface-2 px-2.5 py-1.5 text-xs text-ink outline-none cursor-pointer hover:border-edge-strong"
                    >
                      <option value="custom">Custom order (drag &amp; drop)</option>
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="longest_in_stage">Longest in stage</option>
                      <option value="recently_updated">Recently updated</option>
                    </select>
                  </div>

                  {/* Show completed checkbox */}
                  <div>
                    <label className={`flex items-center gap-2 ${inspect ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={effectiveShowCompleted}
                        disabled={readOnly}
                        onChange={(e) => setShowCompleted(e.target.checked)}
                        className="accent-accent h-3.5 w-3.5"
                      />
                      <span className="font-medium select-none">Show completed rows</span>
                    </label>
                  </div>

                  {/* Date Range Inspection */}
                  <div className="border-t border-edge/60 pt-3">
                    <label className="block text-[11px] font-medium text-ink-muted mb-1.5">Date Range Inspection:</label>
                    {inspect ? (
                      <div className="flex items-center justify-between rounded-[7px] border border-accent bg-accent/10 p-2 text-accent">
                        <span className="font-serif italic text-[11.5px]">
                          {inspect.from} → {inspect.to}
                        </span>
                        <button
                          onClick={() => setInspect(null)}
                          className="font-sans text-xs font-semibold hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <form
                        className="space-y-2.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (draftFrom && draftTo && draftFrom <= draftTo) {
                            setInspect({ from: draftFrom, to: draftTo });
                            setShowFilterPopover(false);
                          }
                        }}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-ink-faint mb-0.5">From:</label>
                            <input
                              type="date"
                              value={draftFrom}
                              onChange={(e) => setDraftFrom(e.target.value)}
                              className="w-full rounded-[7px] border border-edge bg-surface-2 px-1.5 py-1 text-xs text-ink outline-none focus:border-accent"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-ink-faint mb-0.5">To:</label>
                            <input
                              type="date"
                              value={draftTo}
                              onChange={(e) => setDraftTo(e.target.value)}
                              className="w-full rounded-[7px] border border-edge bg-surface-2 px-1.5 py-1 text-xs text-ink outline-none focus:border-accent"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                          className="w-full rounded-[7px] border border-edge bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-edge-strong disabled:opacity-40 cursor-pointer"
                        >
                          Inspect Date Range
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
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
