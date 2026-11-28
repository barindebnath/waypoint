import { DateTime } from "luxon";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { EngineError } from "./engine";

const TEMPO_BASE_URL = "https://api.tempo.io/4";

export interface TempoSubmitResult {
  from: string;
  to: string;
  /** Approval status key that Tempo returns after the submit, for example "IN_REVIEW", or "DRY_RUN" */
  status: string | null;
  /** Where the reviewer came from: the user's Settings, the Tempo reviewers list, or nowhere (Tempo default) */
  reviewer: "settings" | "tempo" | "none";
  /** Number of reviewers that Tempo listed, when the list was read */
  reviewerCount?: number;
}

/**
 * Read the reviewers that Tempo lists for the user (GET /4/timesheet-approvals/user/{accountId}/reviewers).
 * The API reference does not mark a primary reviewer, so the caller takes the first entry.
 * A failed read is not fatal: the submit then goes without a reviewer.
 */
async function fetchTempoReviewer(
  tempoToken: string,
  jiraAccountId: string,
): Promise<{ reviewerId?: string; count: number }> {
  const res = await fetch(`${TEMPO_BASE_URL}/timesheet-approvals/user/${encodeURIComponent(jiraAccountId)}/reviewers`, {
    headers: { Authorization: `Bearer ${tempoToken}`, Accept: "application/json" },
  });
  if (!res.ok) {
    console.error(`Tempo reviewers read failed (HTTP ${res.status}): ${await res.text()}`);
    return { count: 0 };
  }
  const data = (await res.json().catch(() => null)) as { results?: Array<{ accountId?: unknown }> } | null;
  const ids = (data?.results ?? [])
    .map((r) => r?.accountId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  return { reviewerId: ids[0], count: ids.length };
}

/**
 * The latest Tempo week that has ended, or that ends today. Tempo weeks run Sunday to Saturday.
 * Luxon weekdays run 1 (Monday) to 7 (Sunday), Saturday is 6. The week ends on the most recent
 * Saturday, today included. On Saturday 2026-11-28 this returns 2026-11-22 to 2026-11-28.
 * On Sunday 2026-11-29 or Monday 2026-11-30 it returns the same week, so a late or a manual run
 * does not submit a week that is still open.
 */
export function latestTempoWeek(now: DateTime): { from: string; to: string } {
  const to = now.startOf("day").minus({ days: (now.weekday - 6 + 7) % 7 });
  return { from: to.minus({ days: 6 }).toFormat("yyyy-MM-dd"), to: to.toFormat("yyyy-MM-dd") };
}

/**
 * Submit the Tempo timesheet for the latest week that has ended (see `latestTempoWeek`), with the credentials the user saved in Settings.
 * Tempo reference: POST /4/timesheet-approvals/user/{accountId}/submit (https://apidocs.tempo.io/v4/).
 * The reviewer is the one saved in Settings. If none is saved, it is the first reviewer that Tempo lists.
 * With `dryRun`, the function finds the week and the reviewer but does not submit.
 */
export async function submitLastWeekToTempo(userId: string, dryRun = false): Promise<TempoSubmitResult> {
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

  const { from, to } = latestTempoWeek(DateTime.now().setZone(settings.timezone));

  // An empty reviewer is left out, and Tempo then uses its own default.
  const body: { comment: string; reviewerAccountId?: string } = { comment: "" };
  let reviewer: TempoSubmitResult["reviewer"] = "none";
  let reviewerCount: number | undefined;
  const savedReviewer = settings.tempoReviewerId?.trim();
  if (savedReviewer) {
    body.reviewerAccountId = savedReviewer;
    reviewer = "settings";
  } else {
    const listed = await fetchTempoReviewer(tempoToken, jiraAccountId);
    reviewerCount = listed.count;
    if (listed.reviewerId) {
      body.reviewerAccountId = listed.reviewerId;
      reviewer = "tempo";
    }
  }

  if (dryRun) return { from, to, status: "DRY_RUN", reviewer, reviewerCount };

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
  return { from, to, status, reviewer, reviewerCount };
}
