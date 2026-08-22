import type { EnrichedRowView } from "./links";
import type { MonthView } from "./timesheet";

/** Date-range inspection (spec §8) — computed client-side over fetched views. */
export type InspectRange = { from: string; to: string }; // yyyy-MM-dd, inclusive

export function inRange(iso: string | null | undefined, r: InspectRange): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return (
    t >= new Date(`${r.from}T00:00:00`).getTime() &&
    t <= new Date(`${r.to}T23:59:59.999`).getTime()
  );
}

/** Last-touch limitation: matches "most recent change in window", by design. */
export function rowTouchedInRange(row: EnrichedRowView, r: InspectRange): boolean {
  if (inRange(row.createdAt, r)) return true;
  if (row.isComplete && inRange(row.updatedAt, r)) return true;
  if (row.milestones.some((m) => m.complete && inRange(m.updatedAt, r))) return true;
  if (
    row.milestones.some((m) =>
      m.subtasks.some((s) => s.checked && inRange(s.updatedAt, r)),
    )
  ) {
    return true;
  }
  return false;
}

export function monthTouchedInRange(month: MonthView, r: InspectRange): boolean {
  return month.weeks.some(
    (w) =>
      Object.values(w.days).some((d) => d.checked && inRange(d.updatedAt, r)) ||
      (w.submit.status === "submitted" && inRange(w.submit.submittedAt, r)),
  );
}
