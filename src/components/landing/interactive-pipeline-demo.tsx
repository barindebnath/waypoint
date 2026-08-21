"use client";

import { useState } from "react";
import {
  GitPullRequestIcon,
  RotateCcwIcon,
  FastForwardIcon,
  CheckCircleIcon,
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
    name: "Triage & Setup",
    subtasks: [
      { id: "root_cause", label: "Root cause verified in logs" },
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
      { id: "staging_verify", label: "Staging smoke test verified", humanUsual: true },
    ],
  },
  {
    id: "qa",
    name: "QA & Review",
    subtasks: [
      { id: "code_approved", label: "Code review approved by peer" },
      { id: "qa_signoff", label: "QA verification sign-off", humanUsual: true },
    ],
  },
  {
    id: "production",
    name: "Production & Close",
    subtasks: [
      { id: "prod_deploy", label: "Shipped to Production canary", humanUsual: true },
      { id: "jira_close", label: "Jira support card resolved" },
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

  // Determine milestone completion
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

  const handleMilestoneCircleClick = (milestoneIndex: number) => {
    const targetMilestone = DEMO_MILESTONES[milestoneIndex];
    const isComplete = isMilestoneComplete(targetMilestone);

    setChecked((prev) => {
      const next = { ...prev };
      if (isComplete) {
        // Regress target milestone and all subsequent milestones
        for (let i = milestoneIndex; i < DEMO_MILESTONES.length; i++) {
          DEMO_MILESTONES[i].subtasks.forEach((st) => {
            next[st.id] = false;
          });
        }
      } else {
        // Check all subtasks in this milestone
        targetMilestone.subtasks.forEach((st) => {
          next[st.id] = true;
        });
      }
      return next;
    });
    setSelectedMilestoneId(targetMilestone.id);
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
    <div className="w-full rounded-2xl border border-edge bg-surface p-5 shadow-card transition-all duration-300 sm:p-7">
      {/* Header bar / interactive hint */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-accent animate-live" />
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Live Interactive Pipeline
          </span>
          <span className="text-xs text-ink-muted hidden sm:inline">· Try clicking sub-tasks or nodes</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleFastComplete}
            className="flex items-center gap-1 rounded-md border border-edge bg-surface-2 px-2.5 py-1 font-mono text-[11.5px] text-ink-muted transition hover:border-edge-strong hover:text-ink cursor-pointer"
            title="Atomically check every milestone"
          >
            <FastForwardIcon className="h-3 w-3 text-done" />
            <span>Fast-complete</span>
          </button>
          <button
            onClick={handleRegressToDev}
            className="flex items-center gap-1 rounded-md border border-edge bg-surface-2 px-2.5 py-1 font-mono text-[11.5px] text-ink-muted transition hover:border-edge-strong hover:text-ink cursor-pointer"
            title="Demonstrate destructive regression"
          >
            <RotateCcwIcon className="h-3 w-3 text-warn" />
            <span>Regress to Dev</span>
          </button>
          <button
            onClick={handleReset}
            className="rounded-md border border-edge bg-surface-2 px-2.5 py-1 font-mono text-[11.5px] text-ink-muted transition hover:border-edge-strong hover:text-ink cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Row Identity & Pipeline Strip */}
      <div className="mt-5 rounded-xl border border-edge-strong bg-surface-2 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Card Reference Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-support bg-surface px-2.5 py-0.5 font-mono text-[12px] font-semibold text-support shadow-xs">
              <span>ZT-4821</span>
              <span className="text-[10px] uppercase opacity-75 font-sans font-medium">bug</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-edge bg-surface px-2.5 py-0.5 font-mono text-[11.5px] text-ink-muted">
              PES-1032
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-surface px-2.5 py-0.5 font-mono text-[11.5px] text-accent">
              <GitPullRequestIcon className="h-3 w-3" />
              <span>web-client#142</span>
            </span>
          </div>

          {/* Current Milestone Status */}
          <div className="flex items-center gap-2 text-right">
            {isAllComplete ? (
              <span className="inline-flex items-center gap-1.5 font-serif text-sm font-semibold text-done">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Shipped & Closed</span>
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-muted">Current:</span>
                <span className="font-serif text-sm font-medium italic text-accent">
                  {currentActiveMilestone?.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Pipeline Bar */}
        <div className="mt-6 flex items-center justify-between">
          {DEMO_MILESTONES.map((m, idx) => {
            const complete = isMilestoneComplete(m);
            const isCurrent = !complete && idx === activeMilestoneIndex;
            const isSelected = selectedMilestoneId === m.id;

            return (
              <div key={m.id} className="flex flex-1 items-center last:flex-none">
                {/* Milestone Node */}
                <button
                  onClick={() => handleMilestoneCircleClick(idx)}
                  className="group relative flex flex-col items-center focus:outline-none cursor-pointer"
                  title={`${m.name} (Click to ${complete ? "regress" : "check all"})`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-[2px] transition-all duration-200 ${
                      complete
                        ? "border-done bg-done text-surface"
                        : isCurrent
                        ? "border-accent bg-surface ring-4 ring-accent-soft"
                        : "border-edge-strong bg-surface text-ink-faint group-hover:border-ink-muted"
                    } ${isSelected ? "scale-110 shadow-xs" : ""}`}
                  >
                    {complete ? (
                      <span className="text-xs font-bold leading-none">✓</span>
                    ) : isCurrent ? (
                      <span className="h-2 w-2 rounded-full bg-accent animate-live" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-edge-strong" />
                    )}
                  </span>

                  {/* Milestone Name */}
                  <span
                    className={`absolute -bottom-6 whitespace-nowrap text-[11px] font-medium transition-colors ${
                      isSelected
                        ? "font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4"
                        : complete
                        ? "text-ink-muted"
                        : isCurrent
                        ? "text-accent font-semibold"
                        : "text-ink-faint"
                    }`}
                  >
                    {m.name}
                  </span>
                </button>

                {/* Connecting Line */}
                {idx < DEMO_MILESTONES.length - 1 && (
                  <div className="relative mx-1.5 h-[2.5px] flex-1 bg-edge">
                    <div
                      className={`h-full transition-all duration-300 ${
                        complete ? "bg-done" : isCurrent ? "bg-accent/40" : "bg-transparent"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Subtask Checklist Drawer */}
      <div className="mt-10 rounded-xl border border-edge bg-surface-3/30 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-edge pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-sm font-semibold text-ink">
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
                    className={`rounded-md px-2.5 py-0.5 text-xs transition cursor-pointer ${
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
            {progressPercent}% total progress
          </span>
        </div>

        {/* Active Milestone Checklist items */}
        <div className="mt-3.5 space-y-2">
          {activeInspectMilestone.subtasks.map((st) => {
            const isChecked = !!checked[st.id];
            return (
              <label
                key={st.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-2.5 text-sm transition-colors ${
                  isChecked
                    ? "border-done/30 bg-done-soft/40 text-ink"
                    : "border-edge bg-surface text-ink hover:border-edge-strong"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSubtask(st.id)}
                    className="h-4 w-4 rounded border-edge-strong accent-done cursor-pointer"
                  />
                  <span className={isChecked ? "line-through text-ink-muted" : "font-medium"}>
                    {st.label}
                  </span>
                </div>

                {st.humanUsual && (
                  <span
                    className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[10.5px] text-ink-muted"
                    title="This task is verified by the developer, not guessed by AI"
                  >
                    humanUsual
                  </span>
                )}
              </label>
            );
          })}
        </div>

        <p className="mt-3 text-xs italic text-ink-faint">
          💡 <strong>Server calculates progress:</strong> When every sub-task in a milestone is checked, the pipeline automatically advances to the next stage.
        </p>
      </div>
    </div>
  );
}
