"use client";

import { useState, Fragment, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { DAY_KEYS, type DayKey } from "@/lib/timesheet-shared";
import { inRange, monthTouchedInRange, type InspectRange } from "@/lib/inspect";
import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { Spinner } from "./spinner";

function TimesheetDayButton({
  dayLabel,
  checked,
  title,
  disabled,
  isPending,
  onClick,
  grayed,
}: {
  dayLabel: string;
  checked: boolean;
  title: string;
  disabled: boolean;
  isPending: boolean;
  onClick: () => void;
  grayed: boolean;
}) {
  const showSpinner = useDeferredLoading(isPending);

  return (
    <button
      disabled={disabled || isPending}
      title={title}
      onClick={onClick}
      className={`cursor-pointer flex h-[22px] w-[22px] items-center justify-center rounded-lg border text-[9px] font-semibold transition-all duration-200 hover:scale-105 active:scale-90 ${
        checked
          ? "border-accent bg-accent !text-accent-ink shadow-sm"
          : "border-edge bg-transparent text-ink-faint hover:border-edge-strong hover:text-ink"
      } ${grayed ? "opacity-25" : ""} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {showSpinner ? <Spinner className="h-2 w-2 text-current" /> : dayLabel}
    </button>
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

export function TimesheetFooter({
  showCompleted,
  readOnly,
  inspect,
}: {
  showCompleted: boolean;
  readOnly: boolean;
  inspect: InspectRange | null;
}) {

  const [activeMonthIndex, setActiveMonthIndex] = useState(0);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["timesheet"], queryFn: () => api.timesheet(6) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["timesheet"] });

  const tickMut = useMutation({
    mutationFn: (v: { weekId: string; day: DayKey; checked: boolean }) =>
      api.tickDay(v.weekId, v.day, v.checked),
    onSettled: invalidate,
  });
  const submitMut = useMutation({
    mutationFn: (weekId: string) => api.submitWeek(weekId),
    onSettled: invalidate,
  });
  const unsubmitMut = useMutation({
    mutationFn: (weekId: string) => api.unsubmitWeek(weekId),
    onSettled: invalidate,
  });

  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftShadow(el.scrollLeft > 0);
    setShowRightShadow(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      handleScroll();
      el.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleScroll);
      return () => {
        el.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [activeMonthIndex, data]);

  if (!data) return null;

  let months = data.months;
  if (inspect) {
    months = months.filter((m) => monthTouchedInRange(m, inspect));
  } else if (!showCompleted) {
    months = months.filter((m) => !m.allSubmitted);
  }

  const safeIndex = Math.min(activeMonthIndex, Math.max(0, months.length - 1));
  const activeMonth = months[safeIndex];

  return (
    <footer className="sticky bottom-4 z-30 mx-auto w-full max-w-[1100px] mt-6">
      <div className="rounded-2xl border border-edge bg-surface/85 backdrop-blur-md shadow-card px-4 py-4 md:py-5 flex flex-col gap-3.5">
        <div className="flex items-center justify-between w-full border-b border-edge/60 pb-2.5">
          {/* Static Header Left */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink select-none">
              Timesheet Attestation
            </span>
            <span className="hidden sm:inline-flex text-[9px] px-2 py-0.5 rounded-full bg-surface-3 border border-edge text-ink-muted leading-none select-none">
              Tempo Sync
            </span>
          </div>

          {/* Navigation Controls on Right */}
          {activeMonth && (
            <div className="flex items-center gap-2">
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
                className={`text-xs font-semibold flex items-center gap-1.5 min-w-[90px] justify-center select-none ${activeMonth.allSubmitted ? "text-done" : "text-ink-muted"}`}
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
            </div>
          )}
        </div>

        <div className="flex max-h-64 flex-col gap-4 overflow-y-auto pr-1 pt-1">
          {months.length === 0 && (
            <span className="font-serif text-xs italic text-ink-faint">
              Nothing to show here right now.
            </span>
          )}
          {activeMonth && (
            <div className="relative">
              {/* Left shadow fade */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
                  showLeftShadow ? "opacity-100" : "opacity-0"
                }`}
              />
              {/* Right shadow fade */}
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
                        className="flex items-center gap-3 w-fit shrink-0"
                        title={week.weekId}
                      >
                        <div className={`flex gap-1 ${submitted ? "pointer-events-none" : ""}`}>
                          {DAY_KEYS.map((d) => {
                            const day = week.days[d];
                            const grayed = inspect && !inRange(day.updatedAt, inspect);
                            const isTicking = tickMut.isPending && tickMut.variables?.weekId === week.weekId && tickMut.variables?.day === d;
                            const dateNum = week.dates[d] ? parseInt(week.dates[d].split("-")[2], 10) : "";
                            return (
                              <TimesheetDayButton
                                key={d}
                                dayLabel={String(dateNum)}
                                checked={day.checked}
                                title={`${week.dates[d]}${day.updatedAt ? ` · ${new Date(day.updatedAt).toLocaleString()}` : ""}`}
                                disabled={readOnly || submitted || tickMut.isPending}
                                isPending={isTicking}
                                onClick={() =>
                                  tickMut.mutate({ weekId: week.weekId, day: d, checked: !day.checked })
                                }
                                grayed={!!grayed}
                              />
                            );
                          })}
                        </div>
                        {/* Submit marker sits after Friday */}
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
                        <div className="h-5 w-[1px] bg-edge/40 self-center shrink-0" />
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
