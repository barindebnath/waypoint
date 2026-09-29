import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { runAutoTempo } from "@/lib/autotempo";
import { EngineError } from "@/lib/engine";

/** One run calls Tempo, Jira and Microsoft Graph for each user, one call after another. */
export const maxDuration = 300;

/**
 * Compare the bearer token with CRON_SECRET in constant time.
 * Both values are hashed first, so the buffers always have the same length.
 */
function isAuthorizedCronCall(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  // Fail closed: if the secret is not configured, no caller is authorized.
  if (!secret || !authHeader) return false;
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  const actual = createHash("sha256").update(authHeader).digest();
  return timingSafeEqual(expected, actual);
}

interface UserRunSummary {
  userId: string;
  ok: boolean;
  worklogsCreated?: number;
  processedDates?: string[];
  error?: string;
}

/**
 * Weekly AutoTempo run, called by GitHub Actions (see .github/workflows/autotempo.yml).
 * The caller sends `Authorization: Bearer $CRON_SECRET`; every other caller gets 401.
 * Only users who opt in (userSettings.autoTempoScheduled) are processed.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCronCall(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const optedIn = await db
    .select({ userId: schema.userSettings.userId })
    .from(schema.userSettings)
    .where(eq(schema.userSettings.autoTempoScheduled, true));

  // Run users one at a time to stay inside the Tempo and Jira rate limits.
  const results: UserRunSummary[] = [];
  for (const { userId } of optedIn) {
    try {
      const result = await runAutoTempo(userId);
      results.push({
        userId,
        ok: result.success,
        worklogsCreated: result.worklogsCreated,
        processedDates: result.processedDates,
      });
    } catch (err) {
      // EngineError messages are written for users (for example a missing token).
      // Other errors can contain upstream response text, so return a generic message.
      const error = err instanceof EngineError ? err.message : "Internal error";
      console.error(`Scheduled AutoTempo failed for user ${userId}:`, err instanceof Error ? err.message : err);
      results.push({ userId, ok: false, error });
    }
  }

  return NextResponse.json({
    usersProcessed: results.length,
    usersFailed: results.filter((r) => !r.ok).length,
    results,
  });
}
