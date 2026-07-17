import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { handle, jsonError, withIdempotency } from "@/lib/api-helpers";
import { submitWeek } from "@/lib/timesheet";

type Params = { params: Promise<{ weekId: string }> };

export async function POST(_req: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser({ write: true });
    return withIdempotency(user.userId, async () => {
      const { weekId } = await params;
      if (!/^\d{4}-W\d{2}$/.test(weekId)) return jsonError("Invalid week id", 400);
      const week = await submitWeek(user.userId, weekId, user.timezone);
      return NextResponse.json({ week });
    });
  });
}
