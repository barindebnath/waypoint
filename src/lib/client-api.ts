"use client";

import type { EnrichedRowView } from "./links";
import type { MonthView, WeekView } from "./timesheet";
import type { PipelineDef, PipelineKey } from "./pipelines";

export type {
  EnrichedRowView,
  MonthView,
  WeekView,
  PipelineDef,
  PipelineKey,
};

export interface AnalyticsRange {
  from: string;
  to: string;
  bucket: "day" | "week";
  days: number;
}

export type AnalyticsOrigin = "all" | "support_bug" | "support_task" | "product";

export interface AnalyticsFilter {
  origin: AnalyticsOrigin;
}

export interface AnalyticsVelocity {
  completed: number;
  previous: number;
  deltaPct: number | null;
}

export interface AnalyticsLeadTimeItem {
  ref: string;
  days: number;
}

export interface AnalyticsLeadTime {
  avgDays: number | null;
  medianDays: number | null;
  prevAvgDays: number | null;
  deltaPct: number | null;
  fastest: AnalyticsLeadTimeItem | null;
  slowest: AnalyticsLeadTimeItem | null;
}

export interface AnalyticsWipAgingItem {
  identityRef: string;
  origin: "support" | "product";
  subType: "bug" | "task" | null;
  currentMilestone: string | null;
  ageDays: number;
  isStalled: boolean;
}

export interface AnalyticsWip {
  total: number;
  stalledCount: number;
  agingList: AnalyticsWipAgingItem[];
}

export interface AnalyticsDiscipline {
  looseEndsCount: number;
  looseEndsRefs: string[];
  subtaskVerificationRatePct: number;
}

export interface AnalyticsStageDwellTime {
  milestoneKey: string;
  label: string;
  avgHours: number;
  avgDays: number;
  percentage: number;
  isBottleneck: boolean;
}

export interface AnalyticsThroughputBucket {
  bucket: string;
  count: number;
  supportBugCount: number;
  supportTaskCount: number;
  productCount: number;
}

export interface AnalyticsBreakdown {
  support_bug: number;
  support_task: number;
  product: number;
  total: number;
}

export interface AnalyticsData {
  range: AnalyticsRange;
  filter: AnalyticsFilter;
  velocity: AnalyticsVelocity;
  leadTime: AnalyticsLeadTime;
  wip: AnalyticsWip;
  discipline: AnalyticsDiscipline;
  stageDwellTimes: AnalyticsStageDwellTime[];
  throughput: AnalyticsThroughputBucket[];
  breakdown: AnalyticsBreakdown;
}

export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "same-origin",
  });
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    throw new RequestError("Not authenticated", 401);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new RequestError(
      (body as { error?: string } | null)?.error ?? `Request failed (${res.status})`,
      res.status,
    );
  }
  return body as T;
}

export const api = {
  rows: () => request<{ rows: EnrichedRowView[] }>("/api/v1/rows"),
  createRow: (input: {
    identityRef: string;
    origin: "support" | "product";
    subType?: "bug" | "task" | null;
    pipelineKey?: PipelineKey;
  }) => request<{ row: EnrichedRowView }>("/api/v1/rows", { method: "POST", body: JSON.stringify(input) }),
  setSubtask: (ref: string, milestone: string, subtask: string, checked: boolean) =>
    request<{ row: EnrichedRowView }>(`/api/v1/rows/${encodeURIComponent(ref)}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ milestone, subtask, checked }),
    }),
  checkAllSubtasks: (ref: string, milestone: string, checked: boolean) =>
    request<{ row: EnrichedRowView }>(`/api/v1/rows/${encodeURIComponent(ref)}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ milestone, checked }),
    }),
  regress: (ref: string, milestone: string) =>
    request<{ row: EnrichedRowView }>(`/api/v1/rows/${encodeURIComponent(ref)}/regress`, {
      method: "POST",
      body: JSON.stringify({ milestone }),
    }),
  updateRefs: (ref: string, action: "add" | "remove", target: { ref: string; url?: string }) =>
    request<{ row: EnrichedRowView }>(`/api/v1/rows/${encodeURIComponent(ref)}/refs`, {
      method: "POST",
      body: JSON.stringify({ action, ...target }),
    }),
  deleteRow: (ref: string) =>
    request<{ ok: true }>(`/api/v1/rows/${encodeURIComponent(ref)}`, { method: "DELETE" }),
  completeRow: (ref: string) =>
    request<{ row: EnrichedRowView }>(`/api/v1/rows/${encodeURIComponent(ref)}/complete`, { method: "POST" }),
  wontFixRow: (ref: string) =>
    request<{ row: EnrichedRowView }>(`/api/v1/rows/${encodeURIComponent(ref)}/wontfix`, { method: "POST" }),
  pipelines: () => request<{ pipelines: Record<PipelineKey, PipelineDef> }>("/api/v1/pipelines"),
  timesheet: (months = 6) =>
    request<{ currentWeekId: string; months: MonthView[] }>(`/api/v1/timesheet?months=${months}`),
  tickDay: (weekId: string, day: string, checked: boolean) =>
    request<{ week: WeekView }>("/api/v1/timesheet", {
      method: "POST",
      body: JSON.stringify({ weekId, day, checked }),
    }),
  submitWeek: (weekId: string) =>
    request<{ week: WeekView }>(`/api/v1/timesheet/${weekId}/submit`, { method: "POST" }),
  unsubmitWeek: (weekId: string) =>
    request<{ week: WeekView }>(`/api/v1/timesheet/${weekId}/unsubmit`, { method: "POST" }),
  autoTempoFill: (dates?: string[]) =>
    request<{ success: boolean; processedDates: string[]; worklogsCreated: number; totalSecondsLogged: number; messages: string[] }>(
      "/api/v1/timesheet/autotempo",
      { method: "POST", body: JSON.stringify({ dates: dates || [] }) }
    ),
  me: () =>
    request<{
      userId: string;
      timezone: string;
      jiraBaseUrl: string | null;
      jiraEmail: string | null;
      jiraApiToken: string | null;
      githubBaseUrl: string | null;
      githubPat: string | null;
      githubDefaultOrg: string | null;
      colorTheme: string;
      fontTheme: string;
      showTimesheet: boolean;
      tempoApiToken: string | null;
      jiraAccountId: string | null;
      msClientId: string | null;
      msClientSecret: string | null;
      msRefreshToken: string | null;
      autoTempoDefaultRule: unknown;
      autoTempoSkipDays: unknown;
      autoTempoRules: unknown;
    }>("/api/v1/me"),
  updateMe: (patch: {
    timezone?: string;
    jiraBaseUrl?: string | null;
    jiraEmail?: string | null;
    jiraApiToken?: string | null;
    githubBaseUrl?: string | null;
    githubPat?: string | null;
    githubDefaultOrg?: string | null;
    colorTheme?: string;
    fontTheme?: string;
    showTimesheet?: boolean;
    tempoApiToken?: string | null;
    jiraAccountId?: string | null;
    msClientId?: string | null;
    msClientSecret?: string | null;
    msRefreshToken?: string | null;
    autoTempoDefaultRule?: Record<string, unknown> | null;
    autoTempoSkipDays?: string[] | null;
    autoTempoRules?: Record<string, unknown>[] | null;
  }) => request<{ ok: true }>("/api/v1/me", { method: "PATCH", body: JSON.stringify(patch) }),
  syncIntegrations: () =>
    request<{ success: true; syncedJiraCount: number; syncedGithubCount: number; messages?: string[] }>(
      "/api/v1/integrations/sync",
      { method: "POST" }
    ),
  analytics: (from: string, to: string, origin = "all") =>
    request<AnalyticsData>(`/api/v1/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&origin=${encodeURIComponent(origin)}`),
  reorderRows: (rowIds: string[]) =>
    request<{ ok: true }>("/api/v1/rows/reorder", {
      method: "POST",
      body: JSON.stringify({ rowIds }),
      headers: { "Idempotency-Key": `reorder-${Date.now()}-${Math.random()}` },
    }),
  previewRef: (ref: string) =>
    request<{ ref: string; title: string | null }>(
      `/api/v1/integrations/preview?ref=${encodeURIComponent(ref)}`
    ),
  deleteAccount: () =>
    request<{ ok: true }>("/api/v1/account", {
      method: "DELETE",
      body: JSON.stringify({ confirm: "DELETE" }),
    }),
};
