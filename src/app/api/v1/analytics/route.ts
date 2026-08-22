import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { requireUser, ApiError } from "@/lib/api-auth";
import { handle } from "@/lib/api-helpers";
import { listRows, type RowView } from "@/lib/engine";

/**
 * Analytics & Flow Intelligence (spec §2):
 * - Lead Time (creation to completion) with mean, median, delta %, fastest & slowest
 * - WIP Aging Radar for in-flight active cards (>= 7 days flagged as stalled)
 * - Stage Dwell Times & Bottleneck Radar across pipeline milestones
 * - Verification Discipline (subtask check completion % and loose ends)
 * - Stacked Throughput Trend by origin/type
 * - Origin slicing ("all" | "support_bug" | "support_task" | "product")
 *
 * Completion timestamp under last-touch = the final milestone's updated_at
 * (approximate by design; see spec §5.8).
 */

type OriginFilter = "all" | "support_bug" | "support_task" | "product";

function getOriginCategory(r: RowView): "product" | "support_task" | "support_bug" {
  if (r.origin === "product") return "product";
  if (r.subType === "task") return "support_task";
  return "support_bug";
}

function matchesOrigin(r: RowView, filter: OriginFilter): boolean {
  if (filter === "all") return true;
  return getOriginCategory(r) === filter;
}

function completionTime(row: RowView): DateTime | null {
  if (!row.isComplete || !row.milestones || row.milestones.length === 0) return null;
  const last = row.milestones[row.milestones.length - 1];
  if (!last?.updatedAt) return null;
  const dt = DateTime.fromISO(last.updatedAt);
  return dt.isValid ? dt : null;
}

function computeRowLeadTimeDays(row: RowView, completedAt: DateTime): number {
  const createdAt = DateTime.fromISO(row.createdAt);
  if (!createdAt.isValid) return 0;
  const diffDays = completedAt.diff(createdAt).as("days");
  return Math.max(0, diffDays);
}

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const url = new URL(req.url);
    const tz = user.timezone || "UTC";
    const now = DateTime.now().setZone(tz);

    const toParam = url.searchParams.get("to");
    const fromParam = url.searchParams.get("from");
    const originParam = url.searchParams.get("origin") ?? "all";

    const validOrigins: readonly OriginFilter[] = ["all", "support_bug", "support_task", "product"];
    const originFilter: OriginFilter = validOrigins.includes(originParam as OriginFilter)
      ? (originParam as OriginFilter)
      : "all";

    const to = toParam ? DateTime.fromISO(toParam, { zone: tz }).endOf("day") : now.endOf("day");
    const from = fromParam
      ? DateTime.fromISO(fromParam, { zone: tz }).startOf("day")
      : to.minus({ days: 29 }).startOf("day");

    if (!from.isValid || !to.isValid || from > to) {
      throw new ApiError("Invalid date range", 400);
    }

    const rangeDays = Math.max(1, Math.ceil(to.diff(from, "days").days));
    const prevTo = from.minus({ milliseconds: 1 });
    const prevFrom = prevTo.minus({ days: rangeDays }).startOf("day");

    const rows = await listRows(user.userId);

    const allCompletions = rows
      .map((r) => ({ row: r, at: completionTime(r) }))
      .filter((c): c is { row: RowView; at: DateTime } => c.at !== null)
      .map((c) => ({ ...c, at: c.at.setZone(tz) }));

    const inRange = allCompletions.filter(
      (c) => c.at >= from && c.at <= to && matchesOrigin(c.row, originFilter),
    );
    const inPrev = allCompletions.filter(
      (c) => c.at >= prevFrom && c.at <= prevTo && matchesOrigin(c.row, originFilter),
    );

    // Velocity
    const completed = inRange.length;
    const previous = inPrev.length;
    const deltaPct = previous === 0 ? null : Math.round(((completed - previous) / previous) * 100);

    // Lead Time
    let leadTimeAvgDays: number | null = null;
    let leadTimeMedianDays: number | null = null;
    let fastestItem: { ref: string; days: number } | null = null;
    let slowestItem: { ref: string; days: number } | null = null;

    if (inRange.length > 0) {
      const rowLeadTimes = inRange.map((c) => ({
        ref: c.row.identityRef,
        days: computeRowLeadTimeDays(c.row, c.at),
      }));

      const totalDays = rowLeadTimes.reduce((acc, item) => acc + item.days, 0);
      leadTimeAvgDays = Math.round((totalDays / rowLeadTimes.length) * 10) / 10;

      const sortedByDays = [...rowLeadTimes].sort((a, b) => a.days - b.days);
      const mid = Math.floor(sortedByDays.length / 2);
      const rawMedian =
        sortedByDays.length % 2 !== 0
          ? sortedByDays[mid].days
          : (sortedByDays[mid - 1].days + sortedByDays[mid].days) / 2;
      leadTimeMedianDays = Math.round(rawMedian * 10) / 10;

      fastestItem = {
        ref: sortedByDays[0].ref,
        days: Math.round(sortedByDays[0].days * 10) / 10,
      };
      slowestItem = {
        ref: sortedByDays[sortedByDays.length - 1].ref,
        days: Math.round(sortedByDays[sortedByDays.length - 1].days * 10) / 10,
      };
    }

    let prevAvgDays: number | null = null;
    if (inPrev.length > 0) {
      const prevDays = inPrev.map((c) => computeRowLeadTimeDays(c.row, c.at));
      const prevTotal = prevDays.reduce((acc, d) => acc + d, 0);
      prevAvgDays = Math.round((prevTotal / prevDays.length) * 10) / 10;
    }

    let leadTimeDeltaPct: number | null = null;
    if (leadTimeAvgDays !== null && prevAvgDays !== null && prevAvgDays > 0) {
      leadTimeDeltaPct = Math.round(((leadTimeAvgDays - prevAvgDays) / prevAvgDays) * 100);
    }

    // WIP Aging
    const activeRows = rows.filter((r) => !r.isComplete && matchesOrigin(r, originFilter));
    const agingList = activeRows
      .map((r) => {
        const createdAt = DateTime.fromISO(r.createdAt);
        const rawAgeDays = createdAt.isValid ? Math.max(0, now.diff(createdAt).as("days")) : 0;
        const ageDays = Math.round(rawAgeDays * 10) / 10;
        return {
          identityRef: r.identityRef,
          origin: r.origin,
          subType: r.subType,
          currentMilestone: r.currentMilestone,
          ageDays,
          isStalled: ageDays >= 7,
        };
      })
      .sort((a, b) => b.ageDays - a.ageDays);

    const wip = {
      total: agingList.length,
      stalledCount: agingList.filter((item) => item.isStalled).length,
      agingList,
    };

    // Verification Discipline
    const looseEndsRows = rows.filter((r) => r.hasLooseEnds && matchesOrigin(r, originFilter));
    const looseEndsRefs = looseEndsRows.map((r) => r.identityRef);
    const looseEndsCount = looseEndsRefs.length;

    let totalSubtasks = 0;
    let checkedSubtasks = 0;
    for (const c of inRange) {
      for (const m of c.row.milestones) {
        for (const s of m.subtasks) {
          totalSubtasks += 1;
          if (s.checked) checkedSubtasks += 1;
        }
      }
    }
    const subtaskVerificationRatePct =
      totalSubtasks > 0 ? Math.round((checkedSubtasks / totalSubtasks) * 100) : 0;

    const discipline = {
      looseEndsCount,
      looseEndsRefs,
      subtaskVerificationRatePct,
    };

    // Stage Dwell Times & Bottlenecks
    interface StageAccumulator {
      milestoneKey: string;
      label: string;
      totalHours: number;
      count: number;
      order: number;
    }
    const stageMap = new Map<string, StageAccumulator>();
    let stageOrder = 0;

    for (const c of inRange) {
      const row = c.row;
      const rowCreatedAt = DateTime.fromISO(row.createdAt);
      if (!rowCreatedAt.isValid) continue;

      let prevTime = rowCreatedAt;
      for (let i = 0; i < row.milestones.length; i++) {
        const m = row.milestones[i];
        const mUpdatedAt = DateTime.fromISO(m.updatedAt);
        const currTime = mUpdatedAt.isValid ? mUpdatedAt : prevTime;
        const dwellHours = Math.max(0, currTime.diff(prevTime).as("hours"));

        if (!stageMap.has(m.key)) {
          stageMap.set(m.key, {
            milestoneKey: m.key,
            label: m.label,
            totalHours: 0,
            count: 0,
            order: stageOrder++,
          });
        }
        const acc = stageMap.get(m.key)!;
        acc.totalHours += dwellHours;
        acc.count += 1;

        prevTime = currTime;
      }
    }

    const stageList = [...stageMap.values()].sort((a, b) => a.order - b.order);
    const computedStages = stageList.map((s) => {
      const avgHoursRaw = s.count > 0 ? s.totalHours / s.count : 0;
      return {
        milestoneKey: s.milestoneKey,
        label: s.label,
        avgHoursRaw,
        avgHours: Math.round(avgHoursRaw * 10) / 10,
        avgDays: Math.round((avgHoursRaw / 24) * 10) / 10,
      };
    });

    const totalAvgHours = computedStages.reduce((sum, s) => sum + s.avgHoursRaw, 0);

    let maxAvgHours = 0;
    let bottleneckKey: string | null = null;
    for (const s of computedStages) {
      if (s.avgHoursRaw > maxAvgHours) {
        maxAvgHours = s.avgHoursRaw;
        bottleneckKey = s.milestoneKey;
      }
    }

    const stageDwellTimes = computedStages.map((s) => {
      const percentage = totalAvgHours > 0 ? Math.round((s.avgHoursRaw / totalAvgHours) * 100) : 0;
      return {
        milestoneKey: s.milestoneKey,
        label: s.label,
        avgHours: s.avgHours,
        avgDays: s.avgDays,
        percentage,
        isBottleneck: bottleneckKey !== null && s.milestoneKey === bottleneckKey,
      };
    });

    // Throughput Bucketing
    const byDay = rangeDays <= 31;
    const buckets = new Map<
      string,
      { count: number; supportBugCount: number; supportTaskCount: number; productCount: number }
    >();

    let cursor = from.startOf(byDay ? "day" : "week");
    const endLimit = to.endOf(byDay ? "day" : "week");
    while (cursor <= endLimit) {
      const key = byDay
        ? cursor.toFormat("yyyy-MM-dd")
        : `${cursor.weekYear}-W${String(cursor.weekNumber).padStart(2, "0")}`;
      if (!buckets.has(key)) {
        buckets.set(key, { count: 0, supportBugCount: 0, supportTaskCount: 0, productCount: 0 });
      }
      cursor = cursor.plus(byDay ? { days: 1 } : { weeks: 1 });
    }

    for (const c of inRange) {
      const key = byDay
        ? c.at.toFormat("yyyy-MM-dd")
        : `${c.at.weekYear}-W${String(c.at.weekNumber).padStart(2, "0")}`;
      let b = buckets.get(key);
      if (!b) {
        b = { count: 0, supportBugCount: 0, supportTaskCount: 0, productCount: 0 };
        buckets.set(key, b);
      }
      b.count++;
      const cat = getOriginCategory(c.row);
      if (cat === "product") {
        b.productCount++;
      } else if (cat === "support_task") {
        b.supportTaskCount++;
      } else {
        b.supportBugCount++;
      }
    }

    const throughput = [...buckets.entries()].map(([bucket, counts]) => ({
      bucket,
      count: counts.count,
      supportBugCount: counts.supportBugCount,
      supportTaskCount: counts.supportTaskCount,
      productCount: counts.productCount,
    }));

    // Breakdown
    const breakdown = { support_bug: 0, support_task: 0, product: 0, total: 0 };
    for (const c of inRange) {
      const cat = getOriginCategory(c.row);
      breakdown[cat]++;
      breakdown.total++;
    }

    return NextResponse.json({
      range: {
        from: from.toISODate()!,
        to: to.toISODate()!,
        bucket: byDay ? "day" : "week",
        days: rangeDays,
      },
      filter: {
        origin: originFilter,
      },
      velocity: {
        completed,
        previous,
        deltaPct,
      },
      leadTime: {
        avgDays: leadTimeAvgDays,
        medianDays: leadTimeMedianDays,
        prevAvgDays,
        deltaPct: leadTimeDeltaPct,
        fastest: fastestItem,
        slowest: slowestItem,
      },
      wip,
      discipline,
      stageDwellTimes,
      throughput,
      breakdown,
    });
  });
}
