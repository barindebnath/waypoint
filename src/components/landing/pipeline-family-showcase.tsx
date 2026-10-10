"use client";

import { useState } from "react";
import { Chip, PIPELINE_STYLE } from "@/components/chip";
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
  icon: typeof BugIcon;
  /** The pastel tile of the pipeline icon. It matches the pipeline pill of the Board. */
  tile: string;
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
    icon: BugIcon,
    tile: "bg-chip-yellow",
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
      { name: "Production & Close-out", desc: "Canary rollout & close" },
    ],
  },
  {
    key: "support_light",
    name: "Support Light",
    badge: "Fast Track",
    icon: WrenchIcon,
    tile: "bg-chip-aqua",
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
    icon: SparklesIcon,
    tile: "bg-chip-lilac",
    origin: "product",
    summary: "For greenfield features, UX revamps, and technical platform enhancements from initial spec definition to general availability.",
    exampleRef: "OFF-3490",
    secondaryRefs: ["ENG-802", "mobile-app#312"],
    milestones: [
      { name: "Definition", desc: "Technical spec & kickoff" },
      { name: "Development", desc: "Feature branch & tests" },
      { name: "Staging", desc: "Preview staging test" },
      { name: "QA & Review", desc: "Design & QA sign-off" },
      { name: "Production & Close", desc: "Feature flag rollout" },
    ],
  },
];

export function PipelineFamilyShowcase() {
  const [selectedKey, setSelectedKey] = useState<"support_full" | "support_light" | "feature">("support_full");

  const selected = PIPELINE_FAMILIES.find((p) => p.key === selectedKey)!;

  return (
    <div className="w-full space-y-3">
      {/* Selector Tabs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PIPELINE_FAMILIES.map((p) => {
          const isSelected = p.key === selectedKey;
          const TabIcon = p.icon;
          return (
            <button
              key={p.key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedKey(p.key)}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3.5 text-left transition-colors ${
                isSelected ? "bg-surface ring-2 ring-accent" : "bg-bg ring-1 ring-edge hover:bg-surface"
              }`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-chip-ink ${p.tile}`}>
                <TabIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className={`block text-[13px] font-semibold ${isSelected ? "text-ink" : "text-ink-muted"}`}>
                  {p.name}
                </span>
                <span className="mt-0.5 block truncate font-mono text-[11px] text-ink-faint">
                  origin: {p.origin}{p.subType ? ` · ${p.subType}` : ""}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail Container */}
      <div className="space-y-5 rounded-3xl bg-surface p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="font-serif text-lg font-semibold tracking-tight text-ink">{selected.name} Pipeline</h3>
              <Chip tone={PIPELINE_STYLE[selected.key]?.tone ?? "slate"}>{selected.badge}</Chip>
            </div>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-ink-muted">{selected.summary}</p>
          </div>

          {/* Ref pill sample */}
          <div className="flex flex-wrap items-center gap-1.5 self-start font-mono">
            <Chip tone="slate" className="font-mono">{selected.exampleRef}</Chip>
            {selected.secondaryRefs.map((r) => (
              <Chip key={r} tone="ghost" className="font-mono">{r}</Chip>
            ))}
          </div>
        </div>

        {/* Milestone Sequence Flow */}
        <div>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Sequence Flow ({selected.milestones.length} Milestones)
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            {selected.milestones.map((m, idx) => (
              <div key={m.name} className="flex flex-1 flex-col justify-between rounded-xl bg-surface-2 p-3.5">
                <div>
                  <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-ink-faint">
                    <span>Stage 0{idx + 1}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  </div>
                  <div className="text-[13px] font-semibold leading-snug text-ink">{m.name}</div>
                  <div className="mt-1 text-[12px] leading-snug text-ink-muted">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security / Privacy Banner */}
        <div className="flex items-start gap-3 rounded-2xl bg-accent-soft p-4 text-[13px] text-ink">
          <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent-fg" />
          <div className="leading-relaxed">
            <strong>References Only:</strong> Waypoint holds only ticket pointers (<code className="rounded-md bg-surface/60 px-1.5 py-0.5 font-mono text-[12px]">{selected.exampleRef}</code>). No card titles, no customer PII, and no credentials ever touch the database.
          </div>
        </div>
      </div>
    </div>
  );
}
