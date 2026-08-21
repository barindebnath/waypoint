"use client";

import { useState } from "react";
import {
  ShieldCheckIcon,
  BugIcon,
  WrenchIcon,
  SparklesIcon,
  ArrowRightIcon,
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
    badgeClass: "border-support/30 text-support bg-support/10",
    icon: BugIcon,
    origin: "support",
    subType: "bug",
    summary: "For production bugs and escalations requiring full branch creation, PR review, staging verification, and canary deployment.",
    exampleRef: "ZT-4821",
    secondaryRefs: ["PES-1032", "api-repo#89"],
    milestones: [
      { name: "Triage & Setup", desc: "Root cause & repro test" },
      { name: "Development", desc: "Fix code & raise PR" },
      { name: "Staging", desc: "Staging deploy & test" },
      { name: "QA & Review", desc: "Peer approval & sign-off" },
      { name: "Production", desc: "Canary rollout & close" },
    ],
  },
  {
    key: "support_light",
    name: "Support Light",
    badge: "Fast Track",
    badgeClass: "border-support-light/30 text-support-light bg-support-light/10",
    icon: WrenchIcon,
    origin: "support",
    subType: "task",
    summary: "For operational support tasks like DB queries, data fixes, or config changes with no git branch, PR, or deploy lifecycle.",
    exampleRef: "ZT-5012",
    secondaryRefs: ["DB-MAINT-44"],
    milestones: [
      { name: "Triage & Setup", desc: "Scope & query dry-run" },
      { name: "Resolution", desc: "Script execution & verification" },
      { name: "Close-out", desc: "Audit logging & customer confirmation" },
    ],
  },
  {
    key: "feature",
    name: "Product Feature",
    badge: "Feature Flow",
    badgeClass: "border-product/30 text-product bg-product/10",
    icon: SparklesIcon,
    origin: "product",
    summary: "For greenfield features, UX revamps, and technical platform enhancements from initial spec definition to general availability.",
    exampleRef: "OFF-3490",
    secondaryRefs: ["ENG-802", "mobile-app#312"],
    milestones: [
      { name: "Definition", desc: "Technical spec & kickoff" },
      { name: "Development", desc: "Feature branch & tests" },
      { name: "Staging", desc: "Preview staging test" },
      { name: "QA & Review", desc: "Design & QA sign-off" },
      { name: "Production", desc: "Feature flag rollout" },
    ],
  },
];

export function PipelineFamilyShowcase() {
  const [selectedKey, setSelectedKey] = useState<"support_full" | "support_light" | "feature">("support_full");

  const selected = PIPELINE_FAMILIES.find((p) => p.key === selectedKey)!;
  const Icon = selected.icon;

  return (
    <div className="w-full space-y-4">
      {/* Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {PIPELINE_FAMILIES.map((p) => {
          const isSelected = p.key === selectedKey;
          const TabIcon = p.icon;
          return (
            <button
              key={p.key}
              onClick={() => setSelectedKey(p.key)}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-accent bg-surface shadow-card ring-1 ring-accent/20"
                  : "border-edge bg-surface-2 hover:border-edge-strong hover:bg-surface"
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                isSelected ? "border-accent/30 bg-accent-soft text-accent" : "border-edge bg-surface text-ink-muted"
              }`}>
                <TabIcon className="h-4 w-4" />
              </span>
              <div>
                <div className={`text-xs font-semibold ${isSelected ? "text-ink" : "text-ink-muted"}`}>
                  {p.name}
                </div>
                <div className="text-[11px] text-ink-faint font-mono mt-0.5">
                  origin: {p.origin}{p.subType ? ` · ${p.subType}` : ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail Container */}
      <div className="rounded-2xl border border-edge bg-surface p-5 sm:p-6 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-edge pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-base font-semibold text-ink">{selected.name} Pipeline</h3>
              <span className={`rounded-full border px-2 py-0.5 font-mono text-[10.5px] font-semibold ${selected.badgeClass}`}>
                {selected.badge}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1 max-w-xl">{selected.summary}</p>
          </div>

          {/* Ref pill sample */}
          <div className="flex items-center gap-1.5 font-mono text-xs self-start sm:self-auto">
            <span className="rounded-full border border-edge bg-surface-2 px-2.5 py-1 text-ink font-semibold">
              {selected.exampleRef}
            </span>
            {selected.secondaryRefs.map((r) => (
              <span key={r} className="rounded-full border border-edge bg-surface-2 px-2 py-1 text-ink-faint text-[10.5px]">
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Milestone Sequence Flow */}
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-muted mb-3 font-semibold">
            Sequence Flow ({selected.milestones.length} Milestones)
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            {selected.milestones.map((m, idx) => (
              <div key={m.name} className="flex-1 flex flex-col justify-between rounded-xl border border-edge bg-surface-2 p-3">
                <div>
                  <div className="flex items-center justify-between text-[10.5px] font-mono text-ink-faint mb-1">
                    <span>Stage 0{idx + 1}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  </div>
                  <div className="font-serif text-xs font-semibold text-ink">{m.name}</div>
                  <div className="text-[11px] text-ink-muted mt-0.5">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security / Privacy Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent-soft p-3.5 text-xs text-ink">
          <ShieldCheckIcon className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>References Only:</strong> Waypoint holds only ticket pointers (<code>{selected.exampleRef}</code>). No card titles, no customer PII, and no credentials ever touch the database.
          </div>
        </div>
      </div>
    </div>
  );
}
