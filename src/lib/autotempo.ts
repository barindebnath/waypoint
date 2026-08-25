import { DateTime } from "luxon";
import { and, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "./db";
import { tickDay, weekIdFor } from "./timesheet";
import { EngineError } from "./engine";
import { fetchJiraIssueDetails } from "./jira";

export interface AutoTempoRule {
  issue?: string;
  account?: string;
  rule: string | string[];
  type?: string;
  skip?: boolean;
}

export interface AutoTempoDefaultRule {
  issue: string;
  account: string;
  rule: string;
  type?: string;
}

export interface AutoTempoConfig {
  tempoApiToken: string;
  jiraAccountId: string;
  msClientId?: string;
  msClientSecret?: string;
  msRefreshToken?: string;
  defaultRule?: AutoTempoDefaultRule;
  skipDays?: string[];
  rules?: AutoTempoRule[];
}

export interface AutoTempoResult {
  success: boolean;
  processedDates: string[];
  worklogsCreated: number;
  totalSecondsLogged: number;
  messages: string[];
}

const MS_TOKEN_URL = "https://login.microsoftonline.com/organizations/oauth2/v2.0/token";
const MS_CALENDAR_URL = "https://graph.microsoft.com/v1.0/me/calendarview";
const MS_WHO_AM_I_URL = "https://graph.microsoft.com/v1.0/me";
const TEMPO_BASE_URL = "https://api.tempo.io/4";
const DEFAULT_WORK_DAY_SECONDS = 8 * 60 * 60;
const FIVE_MIN_SECONDS = 5 * 60;

import {
  OFFICIAL_ACCOUNTS,
  OFFICIAL_INVESTMENT_CATEGORIES,
  SYSTEM_COMMON_RULES,
  INVESTMENT_CATEGORY_ACCOUNTS,
  ADMIN_ISSUES,
  ADMIN_PROJECT_KEYS,
  ALWAYS_ALLOWED_ON_PROJECT_ISSUES,
  MAX_DAILY_HOURS,
} from "./timesheet-shared";
export {
  OFFICIAL_ACCOUNTS,
  OFFICIAL_INVESTMENT_CATEGORIES,
  SYSTEM_COMMON_RULES,
  INVESTMENT_CATEGORY_ACCOUNTS,
  ADMIN_ISSUES,
  ADMIN_PROJECT_KEYS,
  ALWAYS_ALLOWED_ON_PROJECT_ISSUES,
  MAX_DAILY_HOURS,
};

/** System common rules inherited automatically by all users */
export const BASE_RULES: AutoTempoRule[] = SYSTEM_COMMON_RULES;

/** Map row origin and subType to Tempo account fallback */
function mapOriginToAccount(origin: "support" | "product", subType: "bug" | "task" | null): string {
  if (origin === "product") {
    return "CAP_DEV_NEW";
  }
  if (origin === "support") {
    if (subType === "bug") return "OPX_DEV_FIX";
    return "OPX_SUPPORT";
  }
  return "CAP_DEV_NEW";
}

/** Map Investment Category or fallback origin/subType to Tempo account per rules.json */
function resolveAccountForCandidate(
  investmentCategory: string | undefined,
  origin: "support" | "product",
  subType: "bug" | "task" | null,
): string {
  if (investmentCategory && INVESTMENT_CATEGORY_ACCOUNTS[investmentCategory]?.length > 0) {
    return INVESTMENT_CATEGORY_ACCOUNTS[investmentCategory][0];
  }
  return mapOriginToAccount(origin, subType);
}

export interface ResolvedJiraInfo {
  issueId: string;
  investmentCategory?: string;
}

/** Resolve numeric Jira issue ID and investment category from card ref or secondary refs */
async function resolveJiraIssueInfoForRef(
  jiraBaseUrl: string | null,
  jiraEmail: string | null,
  jiraApiToken: string | null,
  identityRef: string,
  secondaryRefs: schema.ExternalRef[],
  cache: Map<string, ResolvedJiraInfo>,
): Promise<ResolvedJiraInfo | null> {
  const cleanRef = identityRef.trim();

  // If purely numeric digits, e.g. "197349"
  if (/^\d+$/.test(cleanRef)) {
    return { issueId: cleanRef };
  }

  // Check cache for identityRef
  if (cache.has(cleanRef)) {
    return cache.get(cleanRef)!;
  }

  if (!jiraBaseUrl || !jiraEmail || !jiraApiToken) {
    return null;
  }

  // Try resolving identityRef if it looks like Jira key (e.g. OFF-13294, AT-16, PES-11780)
  if (/^[A-Z0-9]+-\d+$/i.test(cleanRef)) {
    const details = await fetchJiraIssueDetails(jiraBaseUrl, jiraEmail, jiraApiToken, cleanRef);
    if (details?.id) {
      const info: ResolvedJiraInfo = {
        issueId: details.id,
        investmentCategory: details.investmentCategory,
      };
      cache.set(cleanRef, info);
      return info;
    }
  }

  // Try secondary refs for a Jira key
  for (const s of secondaryRefs) {
    if (s.ref && /^[A-Z0-9]+-\d+$/i.test(s.ref.trim())) {
      const sRef = s.ref.trim();
      if (cache.has(sRef)) {
        const info = cache.get(sRef)!;
        cache.set(cleanRef, info);
        return info;
      }
      const details = await fetchJiraIssueDetails(jiraBaseUrl, jiraEmail, jiraApiToken, sRef);
      if (details?.id) {
        const info: ResolvedJiraInfo = {
          issueId: details.id,
          investmentCategory: details.investmentCategory,
        };
        cache.set(sRef, info);
        cache.set(cleanRef, info);
        return info;
      }
    }
  }

  return null;
}

/** Fetch Microsoft OAuth access token using refresh token */
async function getMsAccessToken(clientId: string, clientSecret: string | undefined, refreshToken: string): Promise<string> {
  const body = new URLSearchParams();
  body.append("refresh_token", refreshToken);
  body.append("client_id", clientId);
  if (clientSecret) body.append("client_secret", clientSecret);
  body.append("grant_type", "refresh_token");

  const res = await fetch(MS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Microsoft OAuth token refresh failed (HTTP ${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Microsoft OAuth response missing access_token");
  }
  return data.access_token as string;
}

/** Fetch user email from Microsoft Graph API */
async function getMsUserEmail(accessToken: string): Promise<string> {
  const res = await fetch(MS_WHO_AM_I_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return "";
  const data = await res.json();
  return (data.userPrincipalName || data.mail || "").toLowerCase();
}

export interface MsCalendarEvent {
  id: string;
  subject: string;
  isCancelled?: boolean;
  isOrganizer?: boolean;
  originalStartTimeZone?: string;
  originalEndTimeZone?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: Array<{
    emailAddress?: { address?: string };
    status?: { response?: string };
  }>;
}

/** Fetch calendar events from Microsoft Graph API for a date range */
async function getMsCalendarEvents(accessToken: string, fromDateStr: string, toDateStr: string, userTz: string): Promise<MsCalendarEvent[]> {
  const fromIso = DateTime.fromISO(fromDateStr, { zone: userTz }).startOf("day").toUTC().toISO() || "";
  const toIso = DateTime.fromISO(toDateStr, { zone: userTz }).endOf("day").toUTC().toISO() || "";

  const url = `${MS_CALENDAR_URL}?startdatetime=${encodeURIComponent(fromIso)}&enddatetime=${encodeURIComponent(toIso)}&$top=500`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch Microsoft Calendar events (HTTP ${res.status}): ${errText}`);
  }

  const data = await res.json();
  return (data.value || []) as MsCalendarEvent[];
}

/** Check if user attended event */
function didAttend(event: MsCalendarEvent, userEmail: string): boolean {
  if (event.isCancelled) return false;
  if (event.subject === "Out of office") return true;
  if (event.isOrganizer) return true;
  if (Array.isArray(event.attendees) && userEmail) {
    return event.attendees.some((att) => {
      const addr = (att.emailAddress?.address || "").toLowerCase();
      const resp = (att.status?.response || "").toLowerCase();
      return (
        addr === userEmail &&
        (resp === "accepted" || resp === "organizer" || resp === "tentativelyaccepted")
      );
    });
  }
  return false;
}

/** Match event subject against rules */
function matchRule(rules: AutoTempoRule[], subject: string): AutoTempoRule | null {
  const cleanSubject = (subject || "").toLowerCase();

  for (const r of rules) {
    const patterns = Array.isArray(r.rule) ? r.rule : [r.rule];
    const matched = patterns.some((p) => cleanSubject.includes((p || "").toLowerCase()));
    if (matched) return r;
  }

  return null;
}

interface TempoWorklogItem {
  tempoWorklogId: string | number;
  startDate: string;
  timeSpentSeconds: number;
}

/** Fetch all user worklogs from Tempo with pagination across the date range */
async function fetchTempoUserWorklogs(
  tempoToken: string,
  jiraAccountId: string,
  fromStr: string,
  toStr: string,
): Promise<TempoWorklogItem[]> {
  const allWorklogs: TempoWorklogItem[] = [];
  const limit = 500;
  let offset = 0;

  while (true) {
    const listUrl = `${TEMPO_BASE_URL}/worklogs/user/${jiraAccountId}?from=${fromStr}&to=${toStr}&limit=${limit}&offset=${offset}`;
    const res = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${tempoToken}`, Accept: "application/json" },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Tempo fetch worklogs failed (HTTP ${res.status}): ${errText}`);
      break;
    }

    const data = await res.json();
    const results = (data.results || data || []) as TempoWorklogItem[];
    allWorklogs.push(...results);

    if (results.length < limit || !data.metadata?.next) {
      break;
    }
    offset += limit;
  }

  return allWorklogs;
}

/** Delete existing worklogs on Tempo for specific target dates */
async function cleanTempoWorklogs(
  tempoToken: string,
  jiraAccountId: string,
  targetDates: string[],
): Promise<void> {
  if (targetDates.length === 0) return;
  const sortedDates = [...targetDates].sort();
  const fromStr = sortedDates[0];
  const toStr = sortedDates[sortedDates.length - 1];
  const targetDateSet = new Set(targetDates);

  const worklogs = await fetchTempoUserWorklogs(tempoToken, jiraAccountId, fromStr, toStr);

  for (const log of worklogs) {
    if (log.tempoWorklogId && targetDateSet.has(log.startDate)) {
      await fetch(`${TEMPO_BASE_URL}/worklogs/${log.tempoWorklogId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tempoToken}` },
      });
    }
  }
}

/** Create worklog item in Tempo */
async function createTempoWorklog(
  tempoToken: string,
  jiraAccountId: string,
  issueId: string,
  account: string,
  dateStr: string,
  timeSpentSeconds: number,
  description: string,
): Promise<boolean> {
  const payload = {
    issueId,
    startDate: dateStr,
    timeSpentSeconds,
    authorAccountId: jiraAccountId,
    description,
    attributes: [{ key: "_Account_", value: account }],
  };

  const res = await fetch(`${TEMPO_BASE_URL}/worklogs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tempoToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Tempo API worklog creation failed (HTTP ${res.status}): ${errText}`);
    return false;
  }
  return true;
}

/** Find unfilled dates up to today in Tempo (8h logged, skipping non-working days and submitted weeks) */
async function findTargetDatesForResume(
  userId: string,
  tempoToken: string,
  jiraAccountId: string,
  userTz: string,
  skipDays: string[],
): Promise<string[]> {
  const today = DateTime.now().setZone(userTz);
  const thirtyDaysAgo = today.minus({ days: 30 });
  const fromStr = thirtyDaysAgo.toFormat("yyyy-MM-dd");
  const toStr = today.toFormat("yyyy-MM-dd");

  // Query Waypoint submitted weeks for this user
  const storedWeeks = await db
    .select()
    .from(schema.timesheetWeek)
    .where(eq(schema.timesheetWeek.userId, userId));

  const submittedWeekIds = new Set<string>();
  for (const w of storedWeeks) {
    if (w.submit?.status === "submitted") {
      submittedWeekIds.add(w.weekId);
    }
  }

  const worklogs = await fetchTempoUserWorklogs(tempoToken, jiraAccountId, fromStr, toStr);
  const loggedSecondsByDate: Record<string, number> = {};

  for (const log of worklogs) {
    if (log.startDate && log.timeSpentSeconds) {
      loggedSecondsByDate[log.startDate] = (loggedSecondsByDate[log.startDate] || 0) + log.timeSpentSeconds;
    }
  }

  // Walk backwards from today to find latest filled day
  let latestFilledDt: DateTime | null = null;
  let cursor = today;
  while (cursor >= thirtyDaysAgo) {
    const dStr = cursor.toFormat("yyyy-MM-dd");
    const dayName = cursor.toFormat("EEEE");
    const wId = weekIdFor(cursor);

    if (!skipDays.includes(dayName)) {
      const isSubmitted = submittedWeekIds.has(wId);
      const logged = loggedSecondsByDate[dStr] || 0;
      if (isSubmitted || logged >= DEFAULT_WORK_DAY_SECONDS) {
        latestFilledDt = cursor;
        break;
      }
    }
    cursor = cursor.minus({ days: 1 });
  }

  // Determine start date
  const startDt = latestFilledDt ? latestFilledDt.plus({ days: 1 }) : today.startOf("week");

  // Collect target dates from startDt up to today, excluding skipDays, submitted weeks, and already full days
  const dates: string[] = [];
  let curr = startDt;
  while (curr <= today) {
    const dayName = curr.toFormat("EEEE");
    const dStr = curr.toFormat("yyyy-MM-dd");
    const wId = weekIdFor(curr);

    if (!skipDays.includes(dayName) && !submittedWeekIds.has(wId)) {
      const logged = loggedSecondsByDate[dStr] || 0;
      if (logged < DEFAULT_WORK_DAY_SECONDS) {
        dates.push(dStr);
      }
    }
    curr = curr.plus({ days: 1 });
  }

  return dates;
}

/** Run main AutoTempo pipeline for given user and date list (or auto-resume if omitted) */
export async function runAutoTempo(userId: string, targetDates?: string[]): Promise<AutoTempoResult> {
  const messages: string[] = [];

  // Retrieve user settings from DB
  const [settings] = await db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, userId))
    .limit(1);

  if (!settings) {
    throw new EngineError("User settings not found.", 404);
  }

  const tempoToken = settings.tempoApiToken || process.env.TEMPO_API_TOKEN;
  const jiraAccountId = settings.jiraAccountId || process.env.JIRA_ACCOUNT_ID;
  const msRefreshToken = settings.msRefreshToken || process.env.MS_REFRESH_TOKEN;
  const msClientId = settings.msClientId || process.env.MS_CLIENT_ID;
  const msClientSecret = settings.msClientSecret || process.env.MS_CLIENT_SECRET;

  const jiraBaseUrl = settings.jiraBaseUrl || process.env.JIRA_BASE_URL || null;
  const jiraEmail = settings.jiraEmail || process.env.JIRA_EMAIL || null;
  const jiraApiToken = settings.jiraApiToken || process.env.JIRA_API_TOKEN || null;

  if (!tempoToken) throw new EngineError("Tempo API Token is missing. Please configure it in Settings.", 400);
  if (!jiraAccountId) throw new EngineError("Jira Account ID is missing. Please configure it in Settings.", 400);
  if (!msRefreshToken) throw new EngineError("Microsoft Refresh Token is missing. Please configure Microsoft Outlook auth in Settings.", 400);
  if (!msClientId) throw new EngineError("Microsoft Client ID is missing. Please configure it in Settings or MS_CLIENT_ID environment variable.", 400);

  const skipDays = (settings.autoTempoSkipDays as string[] | null) || ["Saturday", "Sunday"];

  let datesToProcess = targetDates && targetDates.length > 0 ? targetDates : [];
  if (datesToProcess.length === 0) {
    messages.push("Auto-detecting last filled day in Tempo...");
    datesToProcess = await findTargetDatesForResume(userId, tempoToken, jiraAccountId, settings.timezone, skipDays);
    messages.push(`Found ${datesToProcess.length} unfilled date(s) to process up to today.`);
  }

  if (datesToProcess.length === 0) {
    return { success: true, processedDates: [], worklogsCreated: 0, totalSecondsLogged: 0, messages: ["All days up to today are already filled in Tempo!"] };
  }

  const customRules = (settings.autoTempoRules as AutoTempoRule[] | null) || [];
  const rules = [...customRules, ...BASE_RULES];

  // Sort dates
  const sortedDates = [...datesToProcess].sort();
  const minDate = sortedDates[0];
  const maxDate = sortedDates[sortedDates.length - 1];

  messages.push(`Processing AutoTempo for dates: ${minDate} to ${maxDate}`);

  // Fetch MS Graph access token & user info
  const msAccessToken = await getMsAccessToken(msClientId, msClientSecret || undefined, msRefreshToken);
  const userEmail = await getMsUserEmail(msAccessToken);

  // Clean existing Tempo worklogs for target dates
  await cleanTempoWorklogs(tempoToken, jiraAccountId, sortedDates);
  messages.push(`Cleaned previous Tempo worklogs for: ${sortedDates.join(", ")}`);

  // Fetch MS Calendar events
  const events = await getMsCalendarEvents(msAccessToken, minDate, maxDate, settings.timezone);
  messages.push(`Fetched ${events.length} calendar events from Microsoft Outlook`);

  let totalWorklogsCreated = 0;
  let totalSeconds = 0;
  const jiraIssueCache = new Map<string, ResolvedJiraInfo>();

  for (const dateStr of sortedDates) {
    const dt = DateTime.fromISO(dateStr, { zone: settings.timezone });
    const dayName = dt.toFormat("EEEE");

    if (skipDays.includes(dayName)) {
      messages.push(`Skipping ${dateStr} (${dayName}) per skip_days rule`);
      continue;
    }

    // Filter events occurring on dateStr
    const eventsOnDay = events.filter((evt) => {
      if (!evt.start?.dateTime) return false;
      const evtStart = DateTime.fromISO(evt.start.dateTime, { zone: settings.timezone });
      return evtStart.toFormat("yyyy-MM-dd") === dateStr;
    });

    let dayLoggedSeconds = 0;

    for (const evt of eventsOnDay) {
      if (!didAttend(evt, userEmail)) continue;

      const ruleMatch = matchRule(rules, evt.subject);
      if (!ruleMatch || ("skip" in ruleMatch && ruleMatch.skip) || !ruleMatch.issue || !ruleMatch.account) continue;

      const resolvedIssue = await resolveJiraIssueInfoForRef(
        jiraBaseUrl,
        jiraEmail,
        jiraApiToken,
        ruleMatch.issue,
        [],
        jiraIssueCache
      );
      const issueId = resolvedIssue?.issueId || (/^\d+$/.test(ruleMatch.issue) ? ruleMatch.issue : null);
      if (!issueId) {
        messages.push(`Warning: Could not resolve Jira issue ID for meeting rule "${evt.subject}" (issue: ${ruleMatch.issue}).`);
        continue;
      }

      const startDt = DateTime.fromISO(evt.start.dateTime);
      const endDt = DateTime.fromISO(evt.end.dateTime);
      let durationSec = Math.round(endDt.diff(startDt, "seconds").seconds);

      if (durationSec > DEFAULT_WORK_DAY_SECONDS) durationSec = DEFAULT_WORK_DAY_SECONDS;
      if (durationSec < FIVE_MIN_SECONDS) durationSec = FIVE_MIN_SECONDS;

      const success = await createTempoWorklog(
        tempoToken,
        jiraAccountId,
        issueId,
        ruleMatch.account,
        dateStr,
        durationSec,
        evt.subject || "Meeting",
      );

      if (success) {
        totalWorklogsCreated++;
        dayLoggedSeconds += durationSec;
        totalSeconds += durationSec;
        messages.push(`Logged ${(durationSec / 3600).toFixed(1)}h for meeting "${evt.subject}" (${issueId})`);
      }
    }

    // Fill remaining hours by distributing across actual Waypoint rows (NO OFF-419 / DUMMY FILLER)
    const remainingSec = DEFAULT_WORK_DAY_SECONDS - dayLoggedSeconds;
    if (remainingSec > 0) {
      const startOfDay = DateTime.fromISO(dateStr, { zone: settings.timezone }).startOf("day").toJSDate();
      const endOfDay = DateTime.fromISO(dateStr, { zone: settings.timezone }).endOf("day").toJSDate();

      // 1. Query sub-task activity on dateStr
      const activeSubtasks = await db
        .select({
          rowId: schema.subtaskState.rowId,
          identityRef: schema.ticketRow.identityRef,
          origin: schema.ticketRow.origin,
          subType: schema.ticketRow.subType,
          secondaryRefs: schema.ticketRow.secondaryRefs,
        })
        .from(schema.subtaskState)
        .innerJoin(schema.ticketRow, eq(schema.subtaskState.rowId, schema.ticketRow.id))
        .where(
          and(
            eq(schema.ticketRow.userId, userId),
            eq(schema.subtaskState.checked, true),
            gte(schema.subtaskState.updatedAt, startOfDay),
            lte(schema.subtaskState.updatedAt, endOfDay)
          )
        );

      const rowActivityMap = new Map<string, {
        rowId: string;
        identityRef: string;
        origin: "support" | "product";
        subType: "bug" | "task" | null;
        secondaryRefs: schema.ExternalRef[];
        tickCount: number;
      }>();

      for (const st of activeSubtasks) {
        const existing = rowActivityMap.get(st.rowId);
        if (existing) {
          existing.tickCount += 1;
        } else {
          rowActivityMap.set(st.rowId, {
            rowId: st.rowId,
            identityRef: st.identityRef,
            origin: st.origin as "support" | "product",
            subType: st.subType as "bug" | "task" | null,
            secondaryRefs: st.secondaryRefs as schema.ExternalRef[],
            tickCount: 1,
          });
        }
      }

      // 2. If no sub-tasks were checked on dateStr, fall back to active (incomplete) Waypoint rows for this user
      if (rowActivityMap.size === 0) {
        const activeRows = await db
          .select({
            rowId: schema.ticketRow.id,
            identityRef: schema.ticketRow.identityRef,
            origin: schema.ticketRow.origin,
            subType: schema.ticketRow.subType,
            secondaryRefs: schema.ticketRow.secondaryRefs,
          })
          .from(schema.ticketRow)
          .where(
            and(
              eq(schema.ticketRow.userId, userId),
              eq(schema.ticketRow.isComplete, false)
            )
          )
          .orderBy(schema.ticketRow.sortOrder, schema.ticketRow.updatedAt);

        const rowsToUse = activeRows.length > 0 ? activeRows : await db
          .select({
            rowId: schema.ticketRow.id,
            identityRef: schema.ticketRow.identityRef,
            origin: schema.ticketRow.origin,
            subType: schema.ticketRow.subType,
            secondaryRefs: schema.ticketRow.secondaryRefs,
          })
          .from(schema.ticketRow)
          .where(eq(schema.ticketRow.userId, userId))
          .orderBy(schema.ticketRow.updatedAt)
          .limit(5);

        for (const r of rowsToUse) {
          rowActivityMap.set(r.rowId, {
            rowId: r.rowId,
            identityRef: r.identityRef,
            origin: r.origin as "support" | "product",
            subType: r.subType as "bug" | "task" | null,
            secondaryRefs: r.secondaryRefs as schema.ExternalRef[],
            tickCount: 1,
          });
        }
      }

      // 3. Resolve Jira issue IDs and accounts for candidate Waypoint rows
      interface CandidateRow {
        identityRef: string;
        issueId: string;
        account: string;
        tickCount: number;
      }
      const candidateRows: CandidateRow[] = [];

      for (const item of rowActivityMap.values()) {
        const jiraInfo = await resolveJiraIssueInfoForRef(
          jiraBaseUrl,
          jiraEmail,
          jiraApiToken,
          item.identityRef,
          item.secondaryRefs,
          jiraIssueCache
        );
        if (jiraInfo?.issueId) {
          const account = resolveAccountForCandidate(jiraInfo.investmentCategory, item.origin, item.subType);
          candidateRows.push({
            identityRef: item.identityRef,
            issueId: jiraInfo.issueId,
            account,
            tickCount: item.tickCount,
          });
        } else {
          messages.push(`Warning: Could not resolve Jira Issue ID for ${item.identityRef}. Make sure Jira credentials are configured in Settings.`);
        }
      }

      // 4. Distribute remaining time among valid Waypoint rows (NO OFF-419 / DUMMY FALLBACK)
      if (candidateRows.length > 0) {
        const totalTicks = candidateRows.reduce((sum, r) => sum + r.tickCount, 0);

        let validRows = candidateRows.map((r) => ({
          ...r,
          allocatedSec: Math.round(remainingSec * (r.tickCount / totalTicks)),
        })).filter((r) => r.allocatedSec >= FIVE_MIN_SECONDS);

        if (validRows.length === 0) {
          validRows = candidateRows.map((r) => ({
            ...r,
            allocatedSec: Math.round(remainingSec / candidateRows.length),
          }));
        }

        const validTotalTicks = validRows.reduce((sum, r) => sum + r.tickCount, 0);

        let allocatedSum = 0;
        for (let i = 0; i < validRows.length; i++) {
          const row = validRows[i];
          if (i === validRows.length - 1) {
            row.allocatedSec = remainingSec - allocatedSum;
          } else {
            row.allocatedSec = Math.round(remainingSec * (row.tickCount / validTotalTicks));
            if (row.allocatedSec < FIVE_MIN_SECONDS) row.allocatedSec = FIVE_MIN_SECONDS;
            allocatedSum += row.allocatedSec;
          }
        }

        for (const row of validRows) {
          if (row.allocatedSec <= 0) continue;
          const success = await createTempoWorklog(
            tempoToken,
            jiraAccountId,
            row.issueId,
            row.account,
            dateStr,
            row.allocatedSec,
            `Work on ${row.identityRef}`
          );
          if (success) {
            totalWorklogsCreated++;
            totalSeconds += row.allocatedSec;
            messages.push(`Logged ${(row.allocatedSec / 3600).toFixed(1)}h for Waypoint card ${row.identityRef} (${row.issueId})`);
          }
        }
      } else {
        messages.push(`No Waypoint rows with valid Jira issue IDs found for ${dateStr}.`);
      }
    }

    // Mark day as checked in Waypoint timesheet
    const dayKey = dt.toFormat("ccc").toLowerCase() as "mon" | "tue" | "wed" | "thu" | "fri";
    if (["mon", "tue", "wed", "thu", "fri"].includes(dayKey)) {
      const wId = weekIdFor(dt);
      try {
        await tickDay(userId, wId, dayKey, true, settings.timezone);
      } catch {
        // Ignore if already submitted error
      }
    }
  }

  messages.push(`AutoTempo complete: Created ${totalWorklogsCreated} worklogs (${(totalSeconds / 3600).toFixed(1)} hrs total)`);

  return {
    success: true,
    processedDates: sortedDates,
    worklogsCreated: totalWorklogsCreated,
    totalSecondsLogged: totalSeconds,
    messages,
  };
}


