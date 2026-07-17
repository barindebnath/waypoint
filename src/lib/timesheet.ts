import { DateTime } from "luxon";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "./db";
import type { TimesheetDays, TimesheetSubmit } from "./db/schema";
import { EngineError } from "./engine";

/**
 * Timesheet rows — manual weekly attestation (spec §6).
 * One object per ISO week; month view is DERIVED: a week belongs to the month
 * its Friday falls in, computed in the user's timezone.
 */

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

const emptyDays = (): TimesheetDays => ({
  mon: { checked: false, updatedAt: null },
  tue: { checked: false, updatedAt: null },
  wed: { checked: false, updatedAt: null },
  thu: { checked: false, updatedAt: null },
  fri: { checked: false, updatedAt: null },
});
const emptySubmit = (): TimesheetSubmit => ({ status: "open", submittedAt: null });

export function weekIdFor(dt: DateTime): string {
  return `${dt.weekYear}-W${String(dt.weekNumber).padStart(2, "0")}`;
}

export function currentWeekId(tz: string): string {
  return weekIdFor(DateTime.now().setZone(tz));
}

/** Monday of the given ISO week id, in the given timezone. */
function mondayOf(weekId: string, tz: string): DateTime {
  const m = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!m) throw new EngineError(`Invalid week id: ${weekId}`);
  return DateTime.fromObject(
    { weekYear: Number(m[1]), weekNumber: Number(m[2]), weekday: 1 },
    { zone: tz },
  );
}

export type WeekView = {
  weekId: string;
  days: TimesheetDays;
  submit: TimesheetSubmit;
  /** ISO dates (yyyy-MM-dd) for mon..fri in the user's timezone. */
  dates: Record<DayKey, string>;
  submittable: boolean;
};

export type MonthView = {
  /** yyyy-MM of the weeks' Fridays. */
  month: string;
  label: string;
  weeks: WeekView[];
  allSubmitted: boolean;
};

export async function listTimesheet(userId: string, tz: string, monthCount = 6): Promise<MonthView[]> {
  // Walk back from the current week until we've covered `monthCount` months.
  const weeks: { weekId: string; friday: DateTime }[] = [];
  let cursor = DateTime.now().setZone(tz).startOf("week");
  const seenMonths = new Set<string>();
  while (true) {
    const friday = cursor.plus({ days: 4 });
    const month = friday.toFormat("yyyy-MM");
    if (!seenMonths.has(month)) {
      if (seenMonths.size >= monthCount) break;
      seenMonths.add(month);
    }
    weeks.push({ weekId: weekIdFor(cursor), friday });
    cursor = cursor.minus({ weeks: 1 });
  }

  const stored = await db
    .select()
    .from(schema.timesheetWeek)
    .where(
      and(
        eq(schema.timesheetWeek.userId, userId),
        inArray(
          schema.timesheetWeek.weekId,
          weeks.map((w) => w.weekId),
        ),
      ),
    );
  const byId = new Map(stored.map((w) => [w.weekId, w]));

  const months = new Map<string, MonthView>();
  for (const { weekId, friday } of weeks) {
    const month = friday.toFormat("yyyy-MM");
    if (!months.has(month)) {
      months.set(month, {
        month,
        label: friday.toFormat("LLLL yyyy"),
        weeks: [],
        allSubmitted: true,
      });
    }
    const rec = byId.get(weekId);
    const days = rec?.days ?? emptyDays();
    const submit = rec?.submit ?? emptySubmit();
    const monday = mondayOf(weekId, tz);
    const view: WeekView = {
      weekId,
      days,
      submit,
      dates: Object.fromEntries(
        DAY_KEYS.map((d, i) => [d, monday.plus({ days: i }).toFormat("yyyy-MM-dd")]),
      ) as Record<DayKey, string>,
      submittable: DAY_KEYS.every((d) => days[d].checked) && submit.status === "open",
    };
    const mv = months.get(month)!;
    mv.weeks.push(view);
    if (submit.status !== "submitted") mv.allSubmitted = false;
  }
  // Newest month first; weeks within a month newest first.
  return [...months.values()];
}

export async function tickDay(
  userId: string,
  weekId: string,
  day: DayKey,
  checked: boolean,
  tz: string,
): Promise<WeekView> {
  mondayOf(weekId, tz); // validates format
  if (!DAY_KEYS.includes(day)) throw new EngineError(`Invalid day: ${day}`);

  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(schema.timesheetWeek)
      .where(
        and(eq(schema.timesheetWeek.userId, userId), eq(schema.timesheetWeek.weekId, weekId)),
      );
    const now = new Date().toISOString();
    if (existing.length === 0) {
      const days = emptyDays();
      days[day] = { checked, updatedAt: now };
      await tx
        .insert(schema.timesheetWeek)
        .values({ userId, weekId, days, submit: emptySubmit() });
      return weekView(weekId, days, emptySubmit(), tz);
    }
    const rec = existing[0];
    if (rec.submit.status === "submitted") {
      throw new EngineError(`Week ${weekId} is already submitted`, 409);
    }
    const days = { ...rec.days, [day]: { checked, updatedAt: now } };
    await tx
      .update(schema.timesheetWeek)
      .set({ days, updatedAt: new Date() })
      .where(eq(schema.timesheetWeek.id, rec.id));
    return weekView(weekId, days, rec.submit, tz);
  });
}

export async function submitWeek(userId: string, weekId: string, tz: string): Promise<WeekView> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(schema.timesheetWeek)
      .where(
        and(eq(schema.timesheetWeek.userId, userId), eq(schema.timesheetWeek.weekId, weekId)),
      );
    if (existing.length === 0) throw new EngineError(`No timesheet entries for ${weekId}`, 404);
    const rec = existing[0];
    if (rec.submit.status === "submitted") {
      throw new EngineError(`Week ${weekId} is already submitted`, 409);
    }
    if (!DAY_KEYS.every((d) => rec.days[d].checked)) {
      throw new EngineError("All five days must be checked before submitting", 409);
    }
    const submit: TimesheetSubmit = { status: "submitted", submittedAt: new Date().toISOString() };
    await tx
      .update(schema.timesheetWeek)
      .set({ submit, updatedAt: new Date() })
      .where(eq(schema.timesheetWeek.id, rec.id));
    return weekView(weekId, rec.days, submit, tz);
  });
}

function weekView(weekId: string, days: TimesheetDays, submit: TimesheetSubmit, tz: string): WeekView {
  const monday = mondayOf(weekId, tz);
  return {
    weekId,
    days,
    submit,
    dates: Object.fromEntries(
      DAY_KEYS.map((d, i) => [d, monday.plus({ days: i }).toFormat("yyyy-MM-dd")]),
    ) as Record<DayKey, string>,
    submittable: DAY_KEYS.every((d) => days[d].checked) && submit.status === "open",
  };
}
