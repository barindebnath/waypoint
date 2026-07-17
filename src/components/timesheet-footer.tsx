"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { DAY_KEYS, type DayKey } from "@/lib/timesheet-shared";
import { inRange, monthTouchedInRange, type InspectRange } from "@/lib/inspect";

const DAY_LABELS: Record<DayKey, string> = { mon: "M", tue: "T", wed: "W", thu: "T", fri: "F" };

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
    <footer className="sticky bottom-0 z-30 border-t border-edge bg-surface/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-2">
        <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink-faint">
          Timesheet — Tempo logged?
          <span className="ml-auto normal-case tracking-normal">
            ◇ submit unlocks at 5/5 · ◆ submitted
          </span>
        </div>
        {/* max ~2 month rows visible; older months scroll */}
        <div className="max-h-24 space-y-1.5 overflow-y-auto pr-1">
          {months.length === 0 && (
            <p className="py-1 text-xs text-ink-faint">Nothing to show here right now.</p>
          )}
          {months.map((month) => (
            <div key={month.month} className="flex items-center gap-3">
              <span
                className={`w-24 shrink-0 text-xs ${month.allSubmitted ? "text-done" : "text-ink-muted"}`}
              >
                {month.label}
                {month.allSubmitted && " ✓"}
              </span>
              <div className="flex flex-row-reverse flex-wrap items-center gap-3">
                {month.weeks.map((week) => {
                  const submitted = week.submit.status === "submitted";
                  const submitGrayed = inspect && !inRange(week.submit.submittedAt, inspect);
                  return (
                    <div
                      key={week.weekId}
                      className="flex items-center gap-1 rounded border border-edge bg-surface-2/60 px-1.5 py-1"
                      title={week.weekId}
                    >
                      <span className="mr-0.5 font-mono text-[9px] text-ink-faint">
                        {week.weekId.slice(5)}
                      </span>
                      {DAY_KEYS.map((d) => {
                        const day = week.days[d];
                        const grayed = inspect && !inRange(day.updatedAt, inspect);
                        return (
                          <button
                            key={d}
                            disabled={readOnly || submitted || tickMut.isPending}
                            title={`${week.dates[d]}${day.updatedAt ? ` · ${new Date(day.updatedAt).toLocaleString()}` : ""}`}
                            onClick={() =>
                              tickMut.mutate({ weekId: week.weekId, day: d, checked: !day.checked })
                            }
                            className={`flex h-5 w-5 items-center justify-center rounded-sm border text-[9px] transition-colors ${
                              day.checked
                                ? "border-done/60 bg-done/25 text-done"
                                : "border-edge bg-surface-3 text-ink-faint hover:border-edge-strong"
                            } ${grayed ? "opacity-25" : ""} disabled:cursor-not-allowed`}
                          >
                            {DAY_LABELS[d]}
                          </button>
                        );
                      })}
                      {/* Submit marker sits after Friday */}
                      <button
                        disabled={readOnly || !week.submittable || submitMut.isPending}
                        title={
                          submitted
                            ? `Submitted ${week.submit.submittedAt ? new Date(week.submit.submittedAt).toLocaleString() : ""}`
                            : week.submittable
                              ? "Mark week as submitted in Tempo"
                              : "Check all five days first"
                        }
                        onClick={() => submitMut.mutate(week.weekId)}
                        className={`ml-0.5 text-sm leading-none ${
                          submitted
                            ? "text-done"
                            : week.submittable
                              ? "text-live hover:scale-110"
                              : "text-ink-faint"
                        } ${submitGrayed && submitted ? "opacity-25" : ""} disabled:cursor-not-allowed`}
                      >
                        {submitted ? "◆" : "◇"}
                      </button>
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
