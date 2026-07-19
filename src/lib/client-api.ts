"use client";

import type { EnrichedRowView } from "./links";
import type { MonthView, WeekView } from "./timesheet";
import type { PipelineDef, PipelineKey } from "./pipelines";

export type { EnrichedRowView, MonthView, WeekView, PipelineDef, PipelineKey };

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
  me: () =>
    request<{
      userId: string;
      timezone: string;
      jiraBaseUrl: string | null;
      githubBaseUrl: string | null;
      colorTheme: string;
      fontTheme: string;
      showTimesheet: boolean;
    }>("/api/v1/me"),
  updateMe: (patch: {
    timezone?: string;
    jiraBaseUrl?: string | null;
    githubBaseUrl?: string | null;
    colorTheme?: string;
    fontTheme?: string;
    showTimesheet?: boolean;
  }) => request<{ ok: true }>("/api/v1/me", { method: "PATCH", body: JSON.stringify(patch) }),
  analytics: (from: string, to: string) =>
    request<{
      range: { from: string; to: string; bucket: "day" | "week" };
      throughput: { bucket: string; count: number }[];
      velocity: { completed: number; previous: number; deltaPct: number | null };
      breakdown: { support_bug: number; support_task: number; product: number };
      looseEnds: { count: number; refs: string[] };
      wip: number;
    }>(`/api/v1/analytics?from=${from}&to=${to}`),
  deleteAccount: () =>
    request<{ ok: true }>("/api/v1/account", {
      method: "DELETE",
      body: JSON.stringify({ confirm: "DELETE" }),
    }),
};
