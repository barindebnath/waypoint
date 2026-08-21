"use client";

import { useState } from "react";
import {
  ShieldCheckIcon,
  BugIcon,
  WrenchIcon,
  SparklesIcon,
} from "./icons";

type PipelineFamily = {
  key: "support_full" | "support_light" | "feature";
  name: string;
  badge: string;
  badgeClass: string;
  icon: typeof BugIcon;
  origin: string;
  subType?: string;
  summary: string;
  milestones: { name: string; desc: string }[];
  exampleRef: string;
  secondaryRefs: string[];
};

const PIPELINE_FAMILIES: PipelineFamily[] = [
  {
    key: "support_full",
    name: "Support Full",
    badge: "Bug Flow",
    badgeClass: "border-support text-support bg-surface-2",
    icon: BugIcon,
    origin: "support",
    subType: "bug",
    summary: "For production bugs and escalations requiring full branch creation, PR review, staging verification, and canary deployment.",
    exampleRef: "ZT-4821",
    secondaryRefs: ["PES-1032", "api-repo#89"],
    milestones: [
      { name: "Triage & Setup", desc: "Root cause identification & repro suite" },
      { name: "Development", desc: "Code fix implementation & PR raised" },
      { name: "Staging", desc: "Staging deployment & integration check" },
      { name: "QA & Review", desc: "Peer approval & QA sign-off" },
      { name: "Production", desc: "Canary rollout & external card closure" },
    ],
  },
  {
    key: "support_light",
    name: "Support Light",
    badge: "Fast Track",
    badgeClass: "border-support-light text-support-light bg-surface-2",
    icon: WrenchIcon,
    origin: "support",
    subType: "task",
    summary: "For operational support tasks like DB queries, data fixes, or config changes with no git branch, PR, or deploy lifecycle.",
    exampleRef: "ZT-5012",
    secondaryRefs: ["DB-MAINT-44"],
    milestones: [
      { name: "Triage & Setup", desc: "Scope review & query sandbox dry-run" },
      { name: "Resolution", desc: "Script execution & state validation" },
      { name: "Close-out", desc: "Audit logging & customer confirmation" },
    ],
  },
  {
    key: "feature",
    name: "Product Feature",
    badge: "Feature Flow",
    badgeClass: "border-product text-product bg-surface-2",
    icon: SparklesIcon,
    origin: "product",
    summary: "For greenfield features, UX revamps, and technical platform enhancements from initial spec definition to general availability.",
    exampleRef: "OFF-3490",
    secondaryRefs: ["ENG-802", "mobile-app#312"],
    milestones: [
      { name: "Definition", desc: "Technical design review & kickoff" },
      { name: "Development", desc: "Feature branch code & automated tests" },
      { name: "Staging", desc: "Preview environment staging test" },
      { name: "QA & Review", desc: "Cross-functional design & QA sign-off" },
      { name: "Production", desc: "Feature flag release & documentation" },
    ],
  },
];

export function PipelineFamilyShowcase() {
  const [selectedKey, setSelectedKey] = useState<"support_full" | "support_light" | "feature">("support_full");

  const selected = PIPELINE_FAMILIES.find((p) => p.key === selectedKey)!;
  const Icon = selected.icon;

  return (
    <div className="w-full space-y-6">
      {/* Pipeline Selector Tabs */}
      <div className="flex flex-wrap gap-2.5">
        {PIPELINE_FAMILIES.map((p) => {
          const isSelected = p.key === selectedKey;
          const TabIcon = p.icon;
          return (
            <button
              key={p.key}
              onClick={() => setSelectedKey(p.key)}
              className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-accent bg-surface shadow-card ring-1 ring-accent/20"
                  : "border-edge bg-surface-2 hover:border-edge-strong hover:bg-surface"
              }`}
            >
              <TabIcon className={`h-4 w-4 ${isSelected ? "text-accent" : "text-ink-muted"}`} />
              <div>
                <div className={`text-xs font-semibold ${isSelected ? "text-ink" : "text-ink-muted"}`}>
                  {p.name}
                </div>
                <div className="text-[11px] text-ink-faint font-mono">
                  {p.origin}{p.subType ? ` · ${p.subType}` : ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Pipeline Detailed Card */}
      <div className="rounded-2xl border border-edge bg-surface p-6 sm:p-7 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-edge pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h3 className="font-serif text-lg font-semibold text-ink">{selected.name} Pipeline</h3>
              <span className={`rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium ${selected.badgeClass}`}>
                {selected.badge}
              </span>
            </div>
            <p className="text-xs text-ink-muted max-w-xl">{selected.summary}</p>
          </div>

          {/* Example Ref Display */}
          <div className="flex items-center gap-2 rounded-lg border border-edge bg-surface-2 px-3 py-1.5 font-mono text-xs">
            <span className="text-ink-muted text-[11px]">Identity:</span>
            <span className="font-semibold text-accent">{selected.exampleRef}</span>
            {selected.secondaryRefs.map((ref) => (
              <span key={ref} className="text-ink-faint text-[10.5px]">
                + {ref}
              </span>
            ))}
          </div>
        </div>

        {/* Milestone Steps Sequence Visualizer */}
        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-4">
            Deterministic Milestone Progression ({selected.milestones.length} Stages)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {selected.milestones.map((m, idx) => (
              <div
                key={m.name}
                className="relative flex flex-col justify-between rounded-xl border border-edge bg-surface-2 p-3.5"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-ink-faint mb-1.5">
                    <span>0{idx + 1}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                  </div>
                  <div className="font-serif text-sm font-semibold text-ink">{m.name}</div>
                  <div className="text-[11.5px] text-ink-muted mt-1 leading-snug">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Design Philosophy Alert: Refs Only */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent-soft p-4">
          <ShieldCheckIcon className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-ink">
            <span className="font-semibold">References-Only Security Architecture:</span> Waypoint never stores card titles, customer descriptions, attachments, or credentials. It holds only immutable references (<code>{selected.exampleRef}</code>), eliminating out-of-sync duplicate copies and zero risk of customer data leakage.
          </div>
        </div>
      </div>
    </div>
  );
}
