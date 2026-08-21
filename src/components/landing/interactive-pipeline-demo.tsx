"use client";

import { useState } from "react";
import {
  GitPullRequestIcon,
  RotateCcwIcon,
  FastForwardIcon,
  CheckCircleIcon,
  RefreshIcon,
} from "./icons";

type Subtask = {
  id: string;
  label: string;
  humanUsual?: boolean;
};

type Milestone = {
  id: string;
  name: string;
  subtasks: Subtask[];
};

const DEMO_MILESTONES: Milestone[] = [
  {
    id: "triage",
    name: "Triage",
    subtasks: [
      { id: "root_cause", label: "Root cause verified in telemetry" },
      { id: "repro_test", label: "Reproduction test case added" },
    ],
  },
  {
    id: "development",
    name: "Development",
    subtasks: [
      { id: "fix_code", label: "Fix implemented & unit tested" },
      { id: "pr_raised", label: "PR #142 opened with test plan" },
    ],
  },
  {
    id: "staging",
    name: "Staging",
    subtasks: [
      { id: "staging_deploy", label: "Branch deployed to Staging" },
      { id: "staging_verify", label: "Staging verification", humanUsual: true },
    ],
  },
  {
    id: "qa",
    name: "QA & Review",
    subtasks: [
      { id: "code_approved", label: "Code review approved by peer" },
      { id: "qa_signoff", label: "QA sign-off & acceptance", humanUsual: true },
    ],
  },
  {
    id: "production",
    name: "Production",
    subtasks: [
      { id: "prod_deploy", label: "Canary release deployed", humanUsual: true },
      { id: "jira_close", label: "Support ticket resolved" },
    ],
  },
];

const INITIAL_CHECKED: Record<string, boolean> = {
  root_cause: true,
  repro_test: true,
  fix_code: true,
  pr_raised: true,
  staging_deploy: true,
  staging_verify: false,
  code_approved: false,
  qa_signoff: false,
  prod_deploy: false,
  jira_close: false,
};

export function InteractivePipelineDemo() {
  const [checked, setChecked] = useState<Record<string, boolean>>(INITIAL_CHECKED);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("staging");

  const isMilestoneComplete = (m: Milestone) =>
    m.subtasks.every((st) => checked[st.id]);

  const activeMilestoneIndex = DEMO_MILESTONES.findIndex((m) => !isMilestoneComplete(m));
  const isAllComplete = activeMilestoneIndex === -1;
  const currentActiveMilestone = isAllComplete
    ? null
    : DEMO_MILESTONES[activeMilestoneIndex];

  const toggleSubtask = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMilestoneClick = (milestoneIndex: number) => {
    const target = DEMO_MILESTONES[milestoneIndex];
    const isComplete = isMilestoneComplete(target);

    setChecked((prev) => {
      const next = { ...prev };
      if (isComplete) {
        // Regress
        for (let i = milestoneIndex; i < DEMO_MILESTONES.length; i++) {
          DEMO_MILESTONES[i].subtasks.forEach((st) => {
            next[st.id] = false;
          });
        }
      } else {
        // Complete all subtasks in this milestone
        target.subtasks.forEach((st) => {
          next[st.id] = true;
        });
      }
      return next;
    });
    setSelectedMilestoneId(target.id);
  };

  const handleFastComplete = () => {
    const allChecked: Record<string, boolean> = {};
    DEMO_MILESTONES.forEach((m) => {
      m.subtasks.forEach((st) => {
        allChecked[st.id] = true;
      });
    });
    setChecked(allChecked);
  };

  const handleRegressToDev = () => {
    setChecked({
      root_cause: true,
      repro_test: true,
      fix_code: true,
      pr_raised: false,
      staging_deploy: false,
      staging_verify: false,
      code_approved: false,
      qa_signoff: false,
      prod_deploy: false,
      jira_close: false,
    });
    setSelectedMilestoneId("development");
  };

  const handleReset = () => {
    setChecked(INITIAL_CHECKED);
    setSelectedMilestoneId("staging");
  };

  const activeInspectMilestone =
    DEMO_MILESTONES.find((m) => m.id === selectedMilestoneId) || DEMO_MILESTONES[0];

  const totalSubtasks = DEMO_MILESTONES.reduce((acc, m) => acc + m.subtasks.length, 0);
  const checkedSubtasks = Object.values(checked).filter(Boolean).length;
  const progressPercent = Math.round((checkedSubtasks / totalSubtasks) * 100);

  return (
    <div className="w-full rounded-2xl border border-edge bg-surface p-5 sm:p-7 shadow-card text-left transition-all">
      {/* Top Bar / Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-edge pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-accent animate-live" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
            Live Sandbox
          </span>
          <span className="text-xs text-ink-muted hidden md:inline">
            · Click subtasks or milestones to see real-time state transitions
          </span>
        </div>

        {/* Sandbox Actions */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={handleFastComplete}
            className="inline-flex items-center gap-1 rounded-md border border-edge bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-ink-muted hover:border-edge-strong hover:text-ink transition cursor-pointer"
            title="Complete all remaining tasks"
          >
            <FastForwardIcon className="h-3 w-3 text-done" />
            <span>Fast-complete</span>
          </button>
          <button
            onClick={handleRegressToDev}
            className="inline-flex items-center gap-1 rounded-md border border-edge bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-ink-muted hover:border-edge-strong hover:text-ink transition cursor-pointer"
            title="Demonstrate destructive regression"
          >
            <RotateCcwIcon className="h-3 w-3 text-warn" />
            <span>Regress to Dev</span>
          </button>
          <button
            onClick={handleReset}
            className="rounded-md border border-edge bg-surface-2 px-2 py-1 font-mono text-[11px] text-ink-muted hover:text-ink transition cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Row Container */}
      <div className="mt-5 rounded-xl border border-edge bg-surface-2 p-4 sm:p-5">
        {/* Row Header with Ref Pills & Current Stage */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Identity Ref Pill */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-support bg-support/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-support">
              <span>ZT-4821</span>
              <span className="text-[9.5px] uppercase tracking-wider opacity-75 font-sans">bug</span>
            </span>

            {/* Secondary Project Ref */}
            <span className="inline-flex items-center rounded-full border border-edge bg-surface px-2.5 py-0.5 font-mono text-[11.5px] text-ink-muted">
              PES-1032
            </span>

            {/* Secondary PR Ref */}
            <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[11px] text-purple-600 dark:text-purple-400">
              <GitPullRequestIcon className="h-3 w-3" />
              <span>web-client#142</span>
            </span>
          </div>

          <div className="text-right">
            {isAllComplete ? (
              <span className="inline-flex items-center gap-1 font-serif text-xs font-semibold text-done">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                <span>Production Complete</span>
              </span>
            ) : (
              <div className="flex items-center sm:justify-end gap-1.5 font-serif text-xs">
                <span className="text-ink-muted">Current:</span>
                <span className="font-semibold italic text-accent">
                  {currentActiveMilestone?.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Milestone Node Progress Strip */}
        <div className="mt-6 grid grid-cols-5 items-center gap-1 sm:gap-2">
          {DEMO_MILESTONES.map((m, idx) => {
            const complete = isMilestoneComplete(m);
            const isCurrent = !complete && idx === activeMilestoneIndex;
            const isSelected = selectedMilestoneId === m.id;

            return (
              <div key={m.id} className="relative flex flex-col items-center">
                {/* Connecting Line between nodes */}
                {idx > 0 && (
                  <div
                    className={`absolute top-3 right-1/2 w-full h-[2px] -z-0 transition-colors duration-300 ${
                      complete || (isCurrent && idx === activeMilestoneIndex)
                        ? "bg-done"
                        : "bg-edge-strong"
                    }`}
                  />
                )}

                {/* Node Circle */}
                <button
                  onClick={() => handleMilestoneClick(idx)}
                  className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-[2px] transition-all cursor-pointer ${
                    complete
                      ? "border-done bg-done text-surface shadow-xs"
                      : isCurrent
                      ? "border-accent bg-surface ring-4 ring-accent-soft"
                      : "border-edge-strong bg-surface text-ink-faint hover:border-ink-muted"
                  } ${isSelected ? "scale-110" : ""}`}
                  title={`${m.name} (click to ${complete ? "regress" : "complete"})`}
                >
                  {complete ? (
                    <span className="text-[11px] font-bold leading-none text-surface">✓</span>
                  ) : isCurrent ? (
                    <span className="h-2 w-2 rounded-full bg-accent animate-live" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-edge-strong" />
                  )}
                </button>

                {/* Node Label */}
                <button
                  onClick={() => setSelectedMilestoneId(m.id)}
                  className={`mt-2 text-center text-[10.5px] sm:text-[11.5px] font-medium transition cursor-pointer truncate max-w-full ${
                    isSelected
                      ? "font-semibold text-accent underline decoration-accent decoration-2 underline-offset-4"
                      : complete
                      ? "text-ink-muted"
                      : isCurrent
                      ? "font-semibold text-ink"
                      : "text-ink-faint"
                  }`}
                >
                  {m.name}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtask Interactive Checklist Drawer */}
      <div className="mt-5 rounded-xl border border-edge bg-surface-3/30 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-edge pb-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-serif text-xs sm:text-sm font-semibold text-ink">
              Milestone Checklist:
            </span>
            <div className="flex flex-wrap gap-1">
              {DEMO_MILESTONES.map((m) => {
                const isSelected = selectedMilestoneId === m.id;
                const complete = isMilestoneComplete(m);
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMilestoneId(m.id)}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition cursor-pointer ${
                      isSelected
                        ? "bg-accent font-semibold text-accent-ink shadow-xs"
                        : complete
                        ? "bg-done-soft text-done hover:bg-done/20"
                        : "bg-surface-2 text-ink-muted hover:text-ink"
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          <span className="font-mono text-xs text-ink-muted">
            {checkedSubtasks}/{totalSubtasks} tasks ({progressPercent}%)
          </span>
        </div>

        {/* Active Checklist Items */}
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {activeInspectMilestone.subtasks.map((st) => {
            const isChecked = !!checked[st.id];
            return (
              <label
                key={st.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition ${
                  isChecked
                    ? "border-done/30 bg-done-soft/30 text-ink"
                    : "border-edge bg-surface text-ink hover:border-edge-strong"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSubtask(st.id)}
                    className="h-3.5 w-3.5 rounded border-edge-strong accent-done cursor-pointer"
                  />
                  <span className={isChecked ? "line-through text-ink-muted" : "font-medium text-ink"}>
                    {st.label}
                  </span>
                </div>

                {st.humanUsual && (
                  <span
                    className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted"
                    title="User confirmation required — AI never guesses"
                  >
                    humanUsual
                  </span>
                )}
              </label>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] italic text-ink-faint">
          <span>💡 Server auto-advances milestone when all sub-tasks in a phase are complete.</span>
          <span className="font-mono text-[10.5px]">POST /api/v1/rows/{`{ref}`}/subtasks</span>
        </div>
      </div>
    </div>
  );
}
