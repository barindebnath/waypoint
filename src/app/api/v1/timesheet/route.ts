import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { handle, parseBody, withIdempotency } from "@/lib/api-helpers";
import { DAY_KEYS, currentWeekId, listTimesheet, tickDay } from "@/lib/timesheet";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const url = new URL(req.url);
    const months = Math.min(Math.max(Number(url.searchParams.get("months") ?? 6), 1), 24);
    const timesheet = await listTimesheet(user.userId, user.timezone, months);
    return NextResponse.json({ currentWeekId: currentWeekId(user.timezone), months: timesheet });
  });
}

const tickSchema = z.object({
  weekId: z
    .string()
    .regex(/^\d{4}-W\d{2}$/)
    .optional(),
  day: z.enum(DAY_KEYS),
  checked: z.boolean(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser({ write: true });
    return withIdempotency(user.userId, async () => {
      const body = await parseBody(req, tickSchema);
      const weekId = body.weekId ?? currentWeekId(user.timezone);
      const week = await tickDay(user.userId, weekId, body.day, body.checked, user.timezone);
      return NextResponse.json({ week });
    });
  });
}
