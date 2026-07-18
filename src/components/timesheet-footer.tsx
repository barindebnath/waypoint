"use client";

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
      className={`flex h-[22px] w-[22px] items-center justify-center rounded-lg border text-[9px] font-semibold transition-all duration-200 hover:scale-105 active:scale-90 ${
        checked
          ? "border-done bg-[var(--done-soft)] text-done shadow-sm"
          : "border-edge bg-surface-3 text-ink-faint hover:border-edge-strong hover:bg-surface hover:text-ink"
      } ${grayed ? "opacity-25" : ""} disabled:cursor-not-allowed`}
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
      <span className="ml-[3px] flex h-4 w-4 items-center justify-center">
        <Spinner className="h-3 w-3 text-accent" />
      </span>
    );
  }

  return (
    <button
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`ml-[3px] flex items-center justify-center p-0.5 rounded transition-all duration-200 ${
        submitted
          ? "text-done hover:scale-105"
          : submittable
            ? "text-accent hover:scale-115 hover:rotate-6 active:scale-95"
            : "text-ink-faint/50"
      } ${submitGrayed && submitted ? "opacity-25" : ""} disabled:cursor-not-allowed`}
    >
      {submitted ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-[15px] h-[15px]">
          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
        </svg>
      ) : submittable ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-[15px] h-[15px] animate-pulse">
          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-.75-4.75a.75.75 0 0 0 1.5 0V8.66l1.95 2.04a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 9.68a.75.75 0 1 0 1.1 1.02l1.95-2.04v4.59Z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-[12px] h-[12px] opacity-40">
          <circle cx={12} cy={12} r={9} />
        </svg>
      )}
    </button>
  );
}

const DAY_LABELS = "MTWTF";

export function TimesheetFooter({
  showCompleted,
  readOnly,
  inspect,
}: {
  showCompleted: boolean;
  readOnly: boolean;
  inspect: InspectRange | null;
}) {
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

  if (!data) return null;

  let months = data.months;
  if (inspect) {
    months = months.filter((m) => monthTouchedInRange(m, inspect));
  } else if (!showCompleted) {
    months = months.filter((m) => !m.allSubmitted);
  }

  return (
    <footer className="sticky bottom-4 z-30 mx-auto w-full max-w-[1100px] px-4 md:px-0 mt-6">
      <div className="rounded-2xl border border-edge bg-surface/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] p-4 md:p-5 flex flex-col gap-3.5 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-edge/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink">
              Timesheet Attestation
            </span>
          </div>
          <span className="font-serif text-[11px] italic text-ink-faint">
            submit unlocks at 5/5
          </span>
        </div>
        <div className="flex max-h-32 flex-col gap-3 overflow-y-auto pr-1">
          {months.length === 0 && (
            <span className="font-serif text-xs italic text-ink-faint">
              Nothing to show here right now.
            </span>
          )}
          {months.map((month) => (
            <div key={month.month} className="flex flex-col md:flex-row md:items-center gap-3.5 py-1.5 border-b border-edge/40 last:border-0">
              <span
                className={`w-28 shrink-0 text-xs font-semibold flex items-center gap-1.5 ${month.allSubmitted ? "text-done" : "text-ink-muted"}`}
              >
                {month.label}
                {month.allSubmitted && (
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-done-soft text-done text-[9px] font-bold">✓</span>
                )}
              </span>
              <div className="flex flex-row-reverse flex-wrap items-center gap-2.5">
                {month.weeks.map((week) => {
                  const submitted = week.submit.status === "submitted";
                  const submitGrayed = inspect && !inRange(week.submit.submittedAt, inspect);
                  return (
                    <div
                      key={week.weekId}
                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-[5px] transition-all duration-200 ${
                        submitted
                          ? "border-edge/40 bg-surface-3/30 opacity-40 select-none pointer-events-none"
                          : "border-edge/70 bg-surface-2/40 hover:border-edge-strong hover:bg-surface-2"
                      }`}
                      title={week.weekId}
                    >
                      <span className="mr-0.5 font-mono text-[10px] font-medium text-ink-faint">
                        {week.weekId.slice(5)}
                      </span>
                      {DAY_KEYS.map((d, di) => {
                        const day = week.days[d];
                        const grayed = inspect && !inRange(day.updatedAt, inspect);
                        const isTicking = tickMut.isPending && tickMut.variables?.weekId === week.weekId && tickMut.variables?.day === d;
                        return (
                          <TimesheetDayButton
                            key={d}
                            dayLabel={DAY_LABELS[di]}
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
                      {/* Submit marker sits after Friday */}
                      <TimesheetSubmitButton
                        disabled={readOnly || !week.submittable || submitMut.isPending}
                        isPending={submitMut.isPending && submitMut.variables === week.weekId}
                        submitted={submitted}
                        submitGrayed={!!submitGrayed}
                        title={
                          submitted
                            ? `Submitted ${week.submit.submittedAt ? new Date(week.submit.submittedAt).toLocaleString() : ""}`
                            : week.submittable
                              ? "Mark week as submitted in Tempo"
                              : "Check all five days first"
                        }
                        onClick={() => submitMut.mutate(week.weekId)}
                        submittable={week.submittable}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
