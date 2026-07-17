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
  if (inRange(row.updatedAt, r)) return true;
  return row.milestones.some(
    (m) => inRange(m.updatedAt, r) || m.subtasks.some((s) => inRange(s.updatedAt, r)),
  );
}

export function monthTouchedInRange(month: MonthView, r: InspectRange): boolean {
  return month.weeks.some(
    (w) =>
      Object.values(w.days).some((d) => inRange(d.updatedAt, r)) ||
      inRange(w.submit.submittedAt, r),
  );
}
