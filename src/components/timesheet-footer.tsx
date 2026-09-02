"use client";

import { useState, Fragment, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { DAY_KEYS, type AutoTempoResult } from "@/lib/timesheet-shared";
import { inRange, type InspectRange } from "@/lib/inspect";
import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { Spinner } from "./spinner";

function TimesheetDayBadge({
  dayLabel,
  checked,
  title,
  grayed,
  canUnfill,
  isUnfilling,
  onUnfill,
}: {
  dayLabel: string;
  checked: boolean;
  title: string;
  grayed: boolean;
  canUnfill?: boolean;
  isUnfilling?: boolean;
  onUnfill?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const showUndo = checked && canUnfill && hovered && !isUnfilling;

  return (
    <div
      title={showUndo ? "Click to un-fill this day" : title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        if (showUndo && onUnfill) {
          e.stopPropagation();
          onUnfill();
        }
      }}
      className={`flex h-[22px] w-[22px] items-center justify-center rounded-lg border text-[9px] font-semibold select-none transition-all duration-200 ${
        isUnfilling
          ? "border-ink-faint/40 bg-surface-2/60 text-ink-faint"
          : showUndo
            ? "border-ink-muted/50 bg-surface-3 !text-ink-muted shadow-sm cursor-pointer scale-110"
            : checked
              ? "border-accent bg-accent !text-accent-ink shadow-sm"
              : "border-edge/60 bg-surface-2/40 text-ink-faint/60"
      } ${grayed ? "opacity-25" : ""}`}
    >
      {isUnfilling ? (
        <Spinner className="h-2.5 w-2.5 text-ink-faint" />
      ) : showUndo ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[11px] h-[11px]">
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 14-4-4m0 0 4-4m-4 4h11a4 4 0 0 1 0 8h-1" />
        </svg>
      ) : (
        dayLabel
      )}
    </div>
  );
}

function TimesheetSubmitButton({
  disabled,
  isPending,
  submitted,
  submitGrayed,
  title,
  onClick,
  submittable,
}: {
  disabled: boolean;
  isPending: boolean;
  submitted: boolean;
  submitGrayed: boolean;
  title: string;
  onClick: () => void;
  submittable: boolean;
}) {
  const showSpinner = useDeferredLoading(isPending);

  if (showSpinner) {
    return (
      <span className="flex h-4 w-4 items-center justify-center">
        <Spinner className="h-3 w-3 text-accent" />
      </span>
    );
  }

  return (
    <button
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`cursor-pointer flex items-center justify-center p-0.5 rounded transition-all duration-200 ${
        submitted
          ? "text-accent hover:scale-110 active:scale-95"
          : submittable
            ? "text-accent hover:scale-115 hover:rotate-6 active:scale-95"
            : "text-ink-faint/50"
      } ${submitGrayed && submitted ? "opacity-25" : ""} disabled:cursor-not-allowed`}
    >
      {submitted ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[13px] h-[13px] text-accent transition-all">
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 14-4-4m0 0 4-4m-4 4h11a4 4 0 0 1 0 8h-1" />
        </svg>
      ) : submittable ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[13px] h-[13px] animate-pulse text-accent">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[11px] h-[11px] text-ink-muted/30 hover:text-ink-muted/50 transition-colors">
          <circle cx={12} cy={12} r={9} />
        </svg>
      )}
    </button>
  );
}

function AutoTempoFeedback({
  result,
  onDismiss,
}: {
  result: AutoTempoResult;
  onDismiss: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const totalHours = (result.totalSecondsLogged / 3600).toFixed(1);
  const daysCount = result.processedDates.length;
  const hasWorklogs = result.days && result.days.some((d) => d.worklogs && d.worklogs.length > 0);
  const isNoOp = result.worklogsCreated === 0 && result.messages.length > 0;

  return (
    <div className="mx-1 mb-2 rounded-xl border border-accent/30 bg-surface-2/80 backdrop-blur-sm p-3 text-xs shadow-sm transition-all animate-fade-in">
      {/* Hero Summary Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent text-[11px] font-bold">
            ✓
          </span>
          <span className="font-semibold text-ink">AutoTempo Complete</span>
          {isNoOp ? (
            <span className="text-ink-muted text-[11px]">
              • {result.messages[0] || "No new worklogs were created."}
            </span>
          ) : (
            <>
              <span className="text-ink-muted text-[11px]">
                • {totalHours} hrs logged across {daysCount} {daysCount === 1 ? "day" : "days"} ({result.worklogsCreated} worklogs)
              </span>

              {/* Date Chips */}
              {result.days && result.days.length > 0 && (
                <div className="flex items-center gap-1 ml-1 flex-wrap">
                  {result.days.map((d) => (
                    <span
                      key={d.date}
                      className="inline-flex items-center gap-1 rounded-md border border-edge/60 bg-surface-3 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted"
                    >
                      <span>{d.date}</span>
                      <span className="font-semibold text-accent">{d.totalHours.toFixed(1)}h</span>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {hasWorklogs && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="cursor-pointer flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-accent hover:bg-accent/10 transition-colors"
            >
              <span>{isExpanded ? "Hide Details" : "View Details"}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          )}

          <button
            onClick={onDismiss}
            title="Dismiss"
            className="cursor-pointer p-1 text-ink-muted hover:text-ink rounded hover:bg-surface-3 transition-colors text-[11px]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Expanded Breakdown Drawer */}
      {isExpanded && hasWorklogs && (
        <div className="mt-3 pt-3 border-t border-edge/50 flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.days.map((day) => (
              <div
                key={day.date}
                className="rounded-lg border border-edge/60 bg-surface/80 p-2.5 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between border-b border-edge/40 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-ink">📅 {day.date}</span>
                  </div>
                  <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                    {day.totalHours.toFixed(1)} hrs
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {day.worklogs.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 text-[11px] rounded bg-surface-2/40 px-2 py-1 hover:bg-surface-2 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="shrink-0 text-xs" title={item.type === "meeting" ? "Meeting" : "Waypoint Card"}>
                          {item.type === "meeting" ? "🗓️" : "🎫"}
                        </span>
                        <span className="truncate font-medium text-ink" title={item.title}>
                          {item.type === "card" && item.ref ? item.ref : item.title}
                        </span>
                        {item.accountName && (
                          <span
                            className="hidden sm:inline-block truncate text-[9px] text-ink-faint rounded bg-surface-3 px-1.5 py-0.5"
                            title={`Account: ${item.account} (${item.accountName})`}
                          >
                            {item.accountName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-semibold text-accent tabular-nums">
                          {item.hours.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Diagnostics Accordion */}
          {result.diagnostics && result.diagnostics.length > 0 && (
            <div className="pt-1">
              <button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="cursor-pointer text-[10px] text-ink-faint hover:text-ink-muted flex items-center gap-1 transition-colors"
              >
                <span>⚙️ {showDiagnostics ? "Hide Sync Diagnostics" : "View Sync Diagnostics"}</span>
                <span className="text-[9px]">({result.diagnostics.length} entries)</span>
              </button>

              {showDiagnostics && (
                <div className="mt-1.5 rounded bg-surface-3/50 p-2 text-[10px] font-mono text-ink-muted space-y-0.5 max-h-32 overflow-y-auto">
                  {result.diagnostics.map((diag, i) => (
                    <div key={i} className="leading-relaxed">• {diag}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TimesheetFooter({
  readOnly,
  inspect,
}: {
  showCompleted?: boolean;
  readOnly: boolean;
  inspect: InspectRange | null;
}) {
  const [activeMonthIndex, setActiveMonthIndex] = useState<number | null>(null);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["timesheet"], queryFn: () => api.timesheet(6) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["timesheet"] });

  const submitMut = useMutation({
    mutationFn: (weekId: string) => api.submitWeek(weekId),
    onSettled: invalidate,
  });
  const unsubmitMut = useMutation({
    mutationFn: (weekId: string) => api.unsubmitWeek(weekId),
    onSettled: invalidate,
  });
  const tickMut = useMutation({
    mutationFn: ({ weekId, day }: { weekId: string; day: string }) =>
      api.tickDay(weekId, day, false),
    onSettled: invalidate,
  });

  const [autoTempoResult, setAutoTempoResult] = useState<AutoTempoResult | null>(null);
  const [autoTempoError, setAutoTempoError] = useState<string | null>(null);

  const autoTempoMut = useMutation({
    mutationFn: (dates?: string[]) => api.autoTempoFill(dates),
    onSuccess: (res) => {
      setAutoTempoError(null);
      setAutoTempoResult(res);
      invalidate();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Execution failed";
      setAutoTempoResult(null);
      setAutoTempoError(message);
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftShadow(scrollLeft > 5);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    handleScroll();
  }, [data, activeMonthIndex]);

  const rawMonths = data?.months ?? [];
  const months = rawMonths;

  // Find the current month's index in the months list (newest first). Defaults to 0 (current month).
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthIdx = months.findIndex((m) => m.month === currentMonthKey);
  const defaultIndex = currentMonthIdx !== -1 ? currentMonthIdx : 0;

  const safeIndex = Math.min(
    activeMonthIndex !== null ? activeMonthIndex : defaultIndex,
    Math.max(0, months.length - 1)
  );
  const activeMonth = months[safeIndex];

  return (
    <footer className="footer-panel rounded-xl border border-edge bg-surface shadow-card transition-colors duration-200 mt-auto">
      <div className="mx-auto flex max-w-[1300px] flex-col gap-2 p-3 sm:p-4">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink select-none">
              Timesheet Attestation
            </span>

            <button
              disabled={readOnly || autoTempoMut.isPending}
              onClick={(e) => {
                e.stopPropagation();
                autoTempoMut.mutate(undefined);
              }}
              title="Find last filled day in Tempo and auto-fill missing days up to today"
              className="cursor-pointer flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-bold text-accent hover:bg-accent hover:text-accent-ink transition-all disabled:opacity-40"
            >
              {autoTempoMut.isPending ? (
                <Spinner className="h-3 w-3 text-current" />
              ) : (
                "⚡ Fill AutoTempo"
              )}
            </button>
          </div>

          {activeMonth && (
            <div className="flex items-center gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                disabled={safeIndex >= months.length - 1}
                onClick={() => setActiveMonthIndex(safeIndex + 1)}
                className="cursor-pointer p-1 rounded hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent text-ink-muted transition-colors"
                title="Previous Month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              
              <span
                className={`text-xs font-semibold flex items-center gap-1.5 min-w-[80px] sm:min-w-[90px] justify-center select-none ${activeMonth.allSubmitted ? "text-done" : "text-ink-muted"}`}
              >
                {activeMonth.label}
                {activeMonth.allSubmitted && (
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-done-soft text-done text-[9px] font-bold">✓</span>
                )}
              </span>

              <button
                disabled={safeIndex <= 0}
                onClick={() => setActiveMonthIndex(safeIndex - 1)}
                className="cursor-pointer p-1 rounded hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent text-ink-muted transition-colors"
                title="Next Month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              <button
                onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                className="md:hidden flex items-center justify-center p-1 rounded text-ink-muted hover:bg-surface-3 ml-1"
                aria-label="Toggle timesheet view"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileExpanded ? "rotate-180" : ""}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className={`max-h-64 flex-col gap-4 overflow-y-auto pr-1 pt-1 ${isMobileExpanded ? "flex" : "hidden md:flex"}`}>
          {autoTempoError && (
            <div className="mx-1 mb-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="font-bold">⚠️ AutoTempo Error:</span>
                <span>{autoTempoError}</span>
              </div>
              <button
                onClick={() => setAutoTempoError(null)}
                className="text-red-500 hover:opacity-75 text-[11px] font-bold cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {autoTempoResult && (
            <AutoTempoFeedback
              result={autoTempoResult}
              onDismiss={() => setAutoTempoResult(null)}
            />
          )}

          {months.length === 0 && (
            <span className="font-serif text-xs italic text-ink-faint">
              Nothing to show here right now.
            </span>
          )}
          {activeMonth && (
            <div className="relative">
              <div
                className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
                  showLeftShadow ? "opacity-100" : "opacity-0"
                }`}
              />
              <div
                className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
                  showRightShadow ? "opacity-100" : "opacity-0"
                }`}
              />

              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex flex-row flex-nowrap items-center gap-5 pl-2 py-1 overflow-x-auto"
              >
                {[...activeMonth.weeks].reverse().map((week, index, arr) => {
                  const submitted = week.submit.status === "submitted";
                  const submitGrayed = inspect && !inRange(week.submit.submittedAt, inspect);

                  return (
                    <Fragment key={week.weekId}>
                      <div
                        className="flex items-center gap-2.5 w-fit shrink-0"
                        title={week.weekId}
                      >
                        <div className="flex gap-1">
                          {DAY_KEYS.map((d) => {
                            const day = week.days[d];
                            const dateStr = week.dates[d];
                            const grayed = inspect && !inRange(day.updatedAt, inspect);
                            const dateNum = dateStr ? parseInt(dateStr.split("-")[2], 10) : "";

                            return (
                              <TimesheetDayBadge
                                key={d}
                                dayLabel={String(dateNum)}
                                checked={day.checked}
                                title={`${dateStr}${day.updatedAt ? ` · Logged ${new Date(day.updatedAt).toLocaleString()}` : ""}`}
                                grayed={!!grayed}
                                canUnfill={!readOnly && !submitted && day.checked}
                                isUnfilling={
                                  tickMut.isPending &&
                                  tickMut.variables?.weekId === week.weekId &&
                                  tickMut.variables?.day === d
                                }
                                onUnfill={() => tickMut.mutate({ weekId: week.weekId, day: d })}
                              />
                            );
                          })}
                        </div>

                        <div className="h-[20px] flex items-center justify-center">
                          <TimesheetSubmitButton
                            disabled={
                              readOnly ||
                              submitMut.isPending ||
                              unsubmitMut.isPending ||
                              (!submitted && !week.submittable)
                            }
                            isPending={
                              (submitMut.isPending && submitMut.variables === week.weekId) ||
                              (unsubmitMut.isPending && unsubmitMut.variables === week.weekId)
                            }
                            submitted={submitted}
                            submitGrayed={!!submitGrayed}
                            title={
                              submitted
                                ? `Submitted ${week.submit.submittedAt ? new Date(week.submit.submittedAt).toLocaleString() : ""} · Click to undo submission`
                                : week.submittable
                                  ? "Mark week as submitted in Tempo"
                                  : "Check all five days first"
                            }
                            onClick={() => {
                              if (submitted) {
                                unsubmitMut.mutate(week.weekId);
                              } else {
                                submitMut.mutate(week.weekId);
                              }
                            }}
                            submittable={week.submittable}
                          />
                        </div>
                      </div>
                      {index < arr.length - 1 && (
                        <div className="h-4 w-px bg-edge shrink-0" />
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
