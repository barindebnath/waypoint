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
      className={`flex h-[21px] w-[21px] items-center justify-center rounded-[5px] border text-[9px] transition-colors ${
        checked
          ? "border-done bg-[var(--done-soft)] text-done"
          : "border-edge bg-surface-3 text-ink-faint hover:border-edge-strong"
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
      <span className="ml-[3px] flex h-3.5 w-3.5 items-center justify-center">
        <Spinner className="h-2.5 w-2.5 text-accent" />
      </span>
    );
  }

  return (
    <button
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`ml-[3px] text-sm leading-none ${
        submitted
          ? "text-done"
          : submittable
            ? "text-accent hover:scale-110"
            : "text-ink-faint"
      } ${submitGrayed && submitted ? "opacity-25" : ""} disabled:cursor-not-allowed`}
    >
      {submitted ? "●" : "○"}
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
    <footer className="sticky bottom-0 z-30 border-t-[3px] border-double border-edge-strong bg-surface shadow-[0_-6px_20px_-12px_rgba(0,0,0,0.25)]">
      <div className="mx-auto max-w-[1100px] px-7 pb-3 pt-2.5">
        <div className="mb-2 flex items-baseline gap-2.5">
          <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Timesheet — Tempo logged?
          </span>
          <span className="ml-auto font-serif text-xs italic text-ink-faint">
            ○ submit unlocks at 5/5 · ● submitted
          </span>
        </div>
        <div className="flex max-h-24 flex-col gap-[7px] overflow-y-auto">
          {months.length === 0 && (
            <span className="font-serif text-xs italic text-ink-faint">
              Nothing to show here right now.
            </span>
          )}
          {months.map((month) => (
            <div key={month.month} className="flex items-center gap-3.5">
              <span
                className={`w-24 shrink-0 text-xs ${month.allSubmitted ? "text-done" : "text-ink-muted"}`}
              >
                {month.label}
                {month.allSubmitted && " ✓"}
              </span>
              <div className="flex flex-row-reverse flex-wrap items-center gap-2.5">
                {month.weeks.map((week) => {
                  const submitted = week.submit.status === "submitted";
                  const submitGrayed = inspect && !inRange(week.submit.submittedAt, inspect);
                  return (
                    <div
                      key={week.weekId}
                      className="flex items-center gap-1 rounded-lg border border-edge bg-surface-2 px-2 py-[5px]"
                      title={week.weekId}
                    >
                      <span className="mr-0.5 font-mono text-[9px] text-ink-faint">
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
