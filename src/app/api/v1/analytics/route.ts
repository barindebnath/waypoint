import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { requireUser, ApiError } from "@/lib/api-auth";
import { handle } from "@/lib/api-helpers";
import { listRows, type RowView } from "@/lib/engine";

/**
 * Analytics, first wave (spec §9): throughput over time, velocity delta vs the
 * previous equal-length period, origin/sub-type breakdown, loose-ends count.
 *
 * Completion timestamp under last-touch = the final milestone's updated_at
 * (approximate by design; see spec §5.8).
 */

function completionTime(row: RowView): DateTime | null {
  if (!row.isComplete) return null;
  const last = row.milestones[row.milestones.length - 1];
  return DateTime.fromISO(last.updatedAt);
}

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const url = new URL(req.url);
    const tz = user.timezone;
    const now = DateTime.now().setZone(tz);
    const toParam = url.searchParams.get("to");
    const fromParam = url.searchParams.get("from");
    const to = toParam ? DateTime.fromISO(toParam, { zone: tz }).endOf("day") : now.endOf("day");
    const from = fromParam
      ? DateTime.fromISO(fromParam, { zone: tz }).startOf("day")
      : to.minus({ days: 29 }).startOf("day");
    if (!from.isValid || !to.isValid || from > to) throw new ApiError("Invalid date range", 400);

    const rangeDays = Math.ceil(to.diff(from, "days").days);
    const prevTo = from.minus({ milliseconds: 1 });
    const prevFrom = prevTo.minus({ days: rangeDays }).startOf("day");

    const rows = await listRows(user.userId);

    const completions = rows
      .map((r) => ({ row: r, at: completionTime(r) }))
      .filter((c): c is { row: RowView; at: DateTime } => c.at !== null)
      .map((c) => ({ ...c, at: c.at.setZone(tz) }));

    const inRange = completions.filter((c) => c.at >= from && c.at <= to);
    const inPrev = completions.filter((c) => c.at >= prevFrom && c.at <= prevTo);

    // Bucket by day for short ranges, by ISO week otherwise.
    const byDay = rangeDays <= 31;
    const buckets = new Map<string, number>();
    let cursor = from;
    while (cursor <= to) {
      buckets.set(
        byDay ? cursor.toFormat("yyyy-MM-dd") : `${cursor.weekYear}-W${String(cursor.weekNumber).padStart(2, "0")}`,
        0,
      );
      cursor = cursor.plus(byDay ? { days: 1 } : { weeks: 1 });
    }
    for (const c of inRange) {
      const key = byDay
        ? c.at.toFormat("yyyy-MM-dd")
        : `${c.at.weekYear}-W${String(c.at.weekNumber).padStart(2, "0")}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    const breakdownKey = (r: RowView) =>
      r.origin === "product" ? "product" : r.subType === "task" ? "support_task" : "support_bug";
    const breakdown = { support_bug: 0, support_task: 0, product: 0 };
    for (const c of inRange) breakdown[breakdownKey(c.row)]++;

    const looseEnds = rows.filter((r) => r.hasLooseEnds).map((r) => r.identityRef);

    const completed = inRange.length;
    const previous = inPrev.length;
    const deltaPct = previous === 0 ? null : Math.round(((completed - previous) / previous) * 100);

    return NextResponse.json({
      range: { from: from.toISODate(), to: to.toISODate(), bucket: byDay ? "day" : "week" },
      throughput: [...buckets.entries()].map(([bucket, count]) => ({ bucket, count })),
      velocity: { completed, previous, deltaPct },
      breakdown,
      looseEnds: { count: looseEnds.length, refs: looseEnds },
      wip: rows.filter((r) => !r.isComplete).length,
    });
  });
}
