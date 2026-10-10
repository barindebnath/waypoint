"use client";

import { useState, Fragment, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { DAY_KEYS, type AutoTempoResult } from "@/lib/timesheet-shared";
import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { Spinner } from "./spinner";
import {
  AlertIcon,
  BoardIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  SlidersIcon,
  SparkleIcon,
  TimesheetIcon,
  UndoIcon,
} from "./icons";

export function TimesheetDayBadge({
  dayLabel,
  checked,
  title,
  canUnfill,
  isUnfilling,
  onUnfill,
  isToday = false,
}: {
  dayLabel: string;
  checked: boolean;
  title: string;
  /** Today gets an accent ring with a gap and a small dot under the date. */
  isToday?: boolean;
  canUnfill?: boolean;
  isUnfilling?: boolean;
  onUnfill?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const showUndo = checked && canUnfill && hovered && !isUnfilling;

  return (
    <div
      aria-current={isToday ? "date" : undefined}
      title={showUndo ? "Click to un-fill this day" : isToday ? `Today · ${title}` : title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        if (showUndo && onUnfill) {
          e.stopPropagation();
          onUnfill();
        }
      }}
      className={`relative flex h-7 w-7 items-center justify-center rounded-[10px] text-[11px] font-semibold tabular-nums select-none transition-all duration-200 ${
        isToday ? "ring-2 ring-accent-fg ring-offset-2 ring-offset-surface" : ""
      } ${
        isUnfilling
          ? "bg-surface-2 text-ink-faint"
          : showUndo
            ? "scale-110 cursor-pointer bg-surface-3 text-ink-muted shadow-sm"
            : checked
              ? "bg-accent text-accent-ink"
              : "bg-surface-2 text-ink-faint"
      } ${isToday && !checked ? "text-accent-fg" : ""}`}
    >
      {isUnfilling ? (
        <Spinner className="h-3 w-3 text-ink-faint" />
      ) : showUndo ? (
        <UndoIcon className="h-3.5 w-3.5" />
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
  title,
  onClick,
  submittable,
}: {
  disabled: boolean;
  isPending: boolean;
  submitted: boolean;
  title: string;
  onClick: () => void;
  submittable: boolean;
}) {
  const showSpinner = useDeferredLoading(isPending);

  if (showSpinner) {
    return (
      <span className="grid h-7 w-7 place-items-center">
        <Spinner className="h-3.5 w-3.5 text-accent-fg" />
      </span>
    );
  }

  return (
    <button
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`group grid h-7 w-7 place-items-center rounded-full transition-all duration-200 ${
        submitted
          ? "bg-accent-soft text-accent-fg hover:scale-110 active:scale-95"
          : submittable
            ? "animate-pulse bg-accent text-accent-ink hover:scale-110 active:scale-95"
            : "bg-surface-2 text-ink-faint"
      } disabled:cursor-not-allowed`}
    >
      {submitted ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 group-hover:hidden" />
          <UndoIcon className="hidden h-3.5 w-3.5 group-hover:block" />
        </>
      ) : submittable ? (
        <CheckIcon className="h-3.5 w-3.5" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      )}
    </button>
  );
}

export function AutoTempoFeedback({
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
    <div className="mb-3 animate-fade-in rounded-2xl bg-surface-2 p-4 text-xs">
      {/* Hero Summary Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
            <CheckIcon className="h-3.5 w-3.5" />
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
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-2.5 py-0.5 text-[10.5px] font-medium text-ink-muted"
                    >
                      <span>{d.date}</span>
                      <span className="font-semibold text-accent-fg">{d.totalHours.toFixed(1)}h</span>
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
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11.5px] font-medium text-accent-fg transition-colors hover:bg-accent-soft"
            >
              <span>{isExpanded ? "Hide Details" : "View Details"}</span>
              <ChevronDownIcon className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          )}

          <button
            onClick={onDismiss}
            title="Dismiss"
            aria-label="Dismiss"
            className="grid h-7 w-7 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
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
                className="flex flex-col gap-2 rounded-2xl bg-surface p-3"
              >
                <div className="flex items-center justify-between border-b border-edge/60 pb-2">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 text-ink-muted" />
                    <span className="text-[11.5px] font-bold text-ink">{day.date}</span>
                  </div>
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-bold text-accent-fg">
                    {day.totalHours.toFixed(1)} hrs
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {day.worklogs.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-2.5 py-1.5 text-[11px] transition-colors hover:bg-surface-3"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="shrink-0 text-ink-muted" title={item.type === "meeting" ? "Meeting" : "Waypoint Card"}>
                          {item.type === "meeting" ? <CalendarIcon className="h-3.5 w-3.5" /> : <BoardIcon className="h-3.5 w-3.5" />}
                        </span>
                        <span className="truncate font-medium text-ink" title={item.title}>
                          {item.type === "card" && item.ref ? item.ref : item.title}
                        </span>
                        {item.accountName && (
                          <span
                            className="hidden sm:inline-block truncate rounded-full bg-surface-3 px-2 py-0.5 text-[9.5px] text-ink-faint"
                            title={`Account: ${item.account} (${item.accountName})`}
                          >
                            {item.accountName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-semibold text-accent-fg tabular-nums">
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
                className="flex items-center gap-1.5 text-[10.5px] text-ink-faint transition-colors hover:text-ink-muted"
              >
                <SlidersIcon className="h-3.5 w-3.5" />
                <span>{showDiagnostics ? "Hide Sync Diagnostics" : "View Sync Diagnostics"}</span>
                <span className="text-[9px]">({result.diagnostics.length} entries)</span>
              </button>

              {showDiagnostics && (
                <div className="mt-1.5 max-h-32 space-y-0.5 overflow-y-auto rounded-xl bg-surface-3/60 p-3 font-mono text-[10px] text-ink-muted">
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

/**
 * The timesheet bar, fixed to the bottom of the window (Board): title and AutoTempo on the left,
 * the dates in the middle, the month pager on the right.
 */
export function TimesheetFooter() {
  const [activeMonthIndex, setActiveMonthIndex] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["timesheet"], queryFn: () => api.timesheet(6) });
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: api.me });
  // Render again once a minute, so the "today" highlight moves at midnight while the page stays open.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  // The week dates are in the user's timezone, so "today" must be too. en-CA formats as yyyy-MM-dd.
  const todayIso = now.toLocaleDateString("en-CA", me?.timezone ? { timeZone: me.timezone } : undefined);
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


  const autoTempoButton = (
    <button
      disabled={autoTempoMut.isPending}
      onClick={(e) => {
        e.stopPropagation();
        autoTempoMut.mutate(undefined);
      }}
      title="AutoTempo: find the last filled day in Tempo and fill the missing days up to today"
      aria-label="Fill missing days with AutoTempo"
      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent-soft px-3.5 text-xs font-semibold text-accent-fg transition-all hover:bg-accent hover:text-accent-ink disabled:opacity-40"
    >
      {autoTempoMut.isPending ? (
        <Spinner className="h-3.5 w-3.5 text-current" />
      ) : (
        <SparkleIcon className="h-3.5 w-3.5" />
      )}
      Fill
    </button>
  );

  const monthPager = activeMonth && (
    <>
      <button
        disabled={safeIndex >= months.length - 1}
        onClick={() => setActiveMonthIndex(safeIndex + 1)}
        className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        title="Previous Month"
        aria-label="Previous month"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      <span
        className={`flex min-w-[92px] select-none items-center justify-center gap-1.5 text-[13px] font-semibold sm:min-w-[120px] ${activeMonth.allSubmitted ? "text-done" : "text-ink-muted"}`}
      >
        {activeMonth.label}
        {activeMonth.allSubmitted && (
          <span className="grid h-4 w-4 place-items-center rounded-full bg-done-soft text-done">
            <CheckIcon className="h-2.5 w-2.5" />
          </span>
        )}
      </span>

      <button
        disabled={safeIndex <= 0}
        onClick={() => setActiveMonthIndex(safeIndex - 1)}
        className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        title="Next Month"
        aria-label="Next month"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </>
  );

  const feedback = (
    <>
      {autoTempoError && (
        <div className="mb-3 flex animate-fade-in items-center justify-between rounded-2xl bg-danger/10 p-4 text-xs text-danger">
          <div className="flex items-center gap-2">
            <AlertIcon className="h-4 w-4 shrink-0" />
            <span className="font-bold">AutoTempo Error:</span>
            <span>{autoTempoError}</span>
          </div>
          <button
            onClick={() => setAutoTempoError(null)}
            aria-label="Dismiss"
            className="ml-2 grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-danger/15"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {autoTempoResult && (
        <AutoTempoFeedback
          result={autoTempoResult}
          onDismiss={() => setAutoTempoResult(null)}
        />
      )}
    </>
  );

  const emptyNote = (
    <span className="text-xs text-ink-faint">
      Nothing to show here right now.
    </span>
  );

  const weeksStrip = activeMonth && (
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
        className="flex flex-row flex-nowrap items-center gap-5 overflow-x-auto px-2 py-2"
      >
        {[...activeMonth.weeks].reverse().map((week, index, arr) => {
          const submitted = week.submit.status === "submitted";

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
                    const dateNum = dateStr ? parseInt(dateStr.split("-")[2], 10) : "";

                    return (
                      <TimesheetDayBadge
                        key={d}
                        dayLabel={String(dateNum)}
                        checked={day.checked}
                        title={`${dateStr}${day.updatedAt ? ` · Logged ${new Date(day.updatedAt).toLocaleString()}` : ""}`}
                        canUnfill={!submitted && day.checked}
                        isUnfilling={
                          tickMut.isPending &&
                          tickMut.variables?.weekId === week.weekId &&
                          tickMut.variables?.day === d
                        }
                        onUnfill={() => tickMut.mutate({ weekId: week.weekId, day: d })}
                        isToday={dateStr === todayIso}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-center">
                  <TimesheetSubmitButton
                    disabled={
                      submitMut.isPending ||
                      unsubmitMut.isPending ||
                      (!submitted && !week.submittable)
                    }
                    isPending={
                      (submitMut.isPending && submitMut.variables === week.weekId) ||
                      (unsubmitMut.isPending && unsubmitMut.variables === week.weekId)
                    }
                    submitted={submitted}
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
  );

  // One row: title and AutoTempo on the left, the dates in the middle (they scroll), the month on the right.
  // An AutoTempo result or error shows above the row until the user dismisses it.
  return (
    <footer className="shrink-0 rounded-[22px] bg-surface">
      <div className="px-3 sm:px-5">
        {(autoTempoError || autoTempoResult) && <div className="max-h-64 overflow-y-auto pt-3">{feedback}</div>}
        <div className="flex items-center gap-3 py-2 sm:gap-5">
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden select-none items-center gap-2 text-[13px] font-semibold text-ink sm:flex">
              <TimesheetIcon className="h-[18px] w-[18px] text-ink-muted" />
              Timesheets
            </span>
            {autoTempoButton}
          </div>
          <div className="min-w-0 flex-1">{months.length === 0 ? emptyNote : weeksStrip}</div>
          {activeMonth && <div className="flex shrink-0 items-center gap-1 sm:gap-2">{monthPager}</div>}
        </div>
      </div>
    </footer>
  );
}
