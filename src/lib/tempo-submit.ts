import { DateTime } from "luxon";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { EngineError } from "./engine";

const TEMPO_BASE_URL = "https://api.tempo.io/4";

export interface TempoSubmitResult {
  from: string;
  to: string;
  /** Approval status key that Tempo returns after the submit, for example "IN_REVIEW" */
  status: string | null;
}

/**
 * The last full Tempo week before `now`. Tempo weeks run Sunday to Saturday.
 * Luxon weekdays run 1 (Monday) to 7 (Sunday), so `weekday % 7` is the number of
 * days since the last Sunday. On Monday 2026-11-23 this returns 2026-11-15 to 2026-11-21.
 */
export function previousTempoWeek(now: DateTime): { from: string; to: string } {
  const thisSunday = now.startOf("day").minus({ days: now.weekday % 7 });
  const from = thisSunday.minus({ days: 7 });
  return { from: from.toFormat("yyyy-MM-dd"), to: from.plus({ days: 6 }).toFormat("yyyy-MM-dd") };
}

/**
 * Submit the Tempo timesheet for the last full week, with the credentials the user saved in Settings.
 * Tempo reference: POST /4/timesheet-approvals/user/{accountId}/submit (https://apidocs.tempo.io/v4/).
 */
export async function submitLastWeekToTempo(userId: string): Promise<TempoSubmitResult> {
  const [settings] = await db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, userId))
    .limit(1);

  if (!settings) throw new EngineError("User settings not found.", 404);

  const tempoToken = settings.tempoApiToken || process.env.TEMPO_API_TOKEN;
  const jiraAccountId = settings.jiraAccountId || process.env.JIRA_ACCOUNT_ID;
  if (!tempoToken) throw new EngineError("Tempo API Token is missing. Please configure it in Settings.", 400);
  if (!jiraAccountId) throw new EngineError("Jira Account ID is missing. Please configure it in Settings.", 400);

  const { from, to } = previousTempoWeek(DateTime.now().setZone(settings.timezone));

  // An empty reviewer is left out, and Tempo then uses its own default.
  const body: { comment: string; reviewerAccountId?: string } = { comment: "" };
  const reviewer = settings.tempoReviewerId?.trim();
  if (reviewer) body.reviewerAccountId = reviewer;

  const url = `${TEMPO_BASE_URL}/timesheet-approvals/user/${encodeURIComponent(jiraAccountId)}/submit?from=${from}&to=${to}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tempoToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Log the upstream text for the operator. The thrown message stays generic, so it never reaches the caller.
    const errText = await res.text();
    console.error(`Tempo timesheet submit failed for user ${userId} (HTTP ${res.status}): ${errText}`);
    throw new EngineError(`Tempo rejected the timesheet submit for ${from} to ${to} (HTTP ${res.status}).`, 502);
  }

  const data = (await res.json().catch(() => null)) as { status?: { key?: unknown } } | null;
  const status = typeof data?.status?.key === "string" ? data.status.key : null;
  return { from, to, status };
}
