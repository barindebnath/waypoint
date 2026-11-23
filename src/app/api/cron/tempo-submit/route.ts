import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { isAuthorizedCronCall } from "@/lib/cron-auth";
import { EngineError } from "@/lib/engine";
import { submitLastWeekToTempo } from "@/lib/tempo-submit";

/** One run makes one Tempo call for each user, one call after another. */
export const maxDuration = 120;

interface UserRunSummary {
  userId: string;
  ok: boolean;
  from?: string;
  to?: string;
  status?: string | null;
  error?: string;
}

/**
 * Weekly Tempo submit, called by GitHub Actions (see .github/workflows/tempo-submit.yml).
 * The caller sends `Authorization: Bearer $CRON_SECRET`; every other caller gets 401.
 * Only users who opt in (userSettings.tempoSubmitScheduled) are processed.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCronCall(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const optedIn = await db
    .select({ userId: schema.userSettings.userId })
    .from(schema.userSettings)
    .where(eq(schema.userSettings.tempoSubmitScheduled, true));

  // Run users one at a time to stay inside the Tempo rate limit.
  const results: UserRunSummary[] = [];
  for (const { userId } of optedIn) {
    try {
      const result = await submitLastWeekToTempo(userId);
      results.push({ userId, ok: true, ...result });
    } catch (err) {
      // EngineError messages are written for users (for example a missing token).
      // Other errors can contain upstream response text, so return a generic message.
      const error = err instanceof EngineError ? err.message : "Internal error";
      console.error(`Scheduled Tempo submit failed for user ${userId}:`, err instanceof Error ? err.message : err);
      results.push({ userId, ok: false, error });
    }
  }

  return NextResponse.json({
    usersProcessed: results.length,
    usersFailed: results.filter((r) => !r.ok).length,
    results,
  });
}
