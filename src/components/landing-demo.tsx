"use client";

import { useEffect, useState } from "react";

/**
 * Hero demo: a scripted Waypoint row being advanced tick by tick, the way an
 * agent drives the real API. Pure theatre — no network, loops forever.
 */
const MILESTONES = [
  { label: "Triage & Setup", subtasks: ["ZT picked up", "Classified as Bug", "Dupe Bug created + linked", "Investment category added"] },
  { label: "Development", subtasks: ["Fix implemented", "Tested locally", "Branch created", "Code committed", "PR raised"] },
  { label: "Staging", subtasks: ["Deployed to staging", "Staging post in Teams", "Card to Ready for QA"] },
  { label: "QA & Review", subtasks: ["Tested on staging", "PR reviewed & approved"] },
  { label: "Production & Close-out", subtasks: ["Merged to main", "Deployed to prod", "Release announcement", "Tested on prod", "Comment on project card", "Comment on ZT", "ZT closed"] },
];
const TOTAL = MILESTONES.reduce((n, m) => n + m.subtasks.length, 0);
const START = MILESTONES[0].subtasks.length; // triage pre-done
const SOURCES = ["claude-code", "you", "claude-code", "ci"];

function position(ticks: number) {
  let rest = ticks;
  for (let i = 0; i < MILESTONES.length; i++) {
    const n = MILESTONES[i].subtasks.length;
    if (rest < n) return { idx: i, done: rest };
    rest -= n;
  }
  return { idx: MILESTONES.length - 1, done: MILESTONES[MILESTONES.length - 1].subtasks.length };
}

export function LandingDemo() {
  const [ticks, setTicks] = useState(START);

  useEffect(() => {
    // Reduced motion: stay on the static start frame.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setTicks((v) => (v >= TOTAL ? START : v + 1));
    }, 1100);
    return () => clearInterval(t);
  }, []);

  const pos = position(Math.min(ticks, TOTAL - 1));
  const complete = ticks >= TOTAL;
  const current = MILESTONES[pos.idx];
  const lastSource = SOURCES[ticks % SOURCES.length];

  return (
    <div className="rounded-2xl border border-edge bg-surface p-5 shadow-[0_40px_80px_-50px_rgba(0,0,0,0.9)]">
      {/* pills */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="whitespace-nowrap rounded-full border border-support/50 bg-surface-2 px-2 py-0.5 font-mono text-xs text-support">ZT-4821 ↗</span>
        <span className="whitespace-nowrap rounded-full border border-edge bg-surface-2 px-2 py-0.5 font-mono text-xs text-ink-muted">PES-1032 ↗</span>
        <span className="whitespace-nowrap rounded-full border border-edge bg-surface-2 px-2 py-0.5 font-mono text-xs text-ink-muted">panipuri#87 ↗</span>
        <span className="ml-auto whitespace-nowrap text-[10px] uppercase tracking-wider text-support">Support · Bug</span>
      </div>

      {/* milestone bar */}
      <div className="flex h-2.5 items-center gap-0.5">
        {MILESTONES.map((m, i) => (
          <span
            key={m.label}
            className={`h-full flex-1 rounded-sm transition-colors duration-500 ${
              complete || i < pos.idx ? "bg-done" : i === pos.idx ? "bg-live/40 animate-live" : "bg-surface-3"
            }`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9px] text-ink-faint">
        {MILESTONES.map((m, i) => (
          <span key={m.label} className={complete || i < pos.idx ? "text-done/70" : i === pos.idx ? "text-live" : ""}>
            {m.label.split(" ")[0]}
          </span>
        ))}
      </div>

      {/* current checklist */}
      <div className="mt-4 rounded-lg border border-edge bg-surface-2/60 p-3">
        <p className={`mb-2 text-xs font-medium ${complete ? "text-done" : "text-live"}`}>
          {complete ? "✓ Complete — closed out on both sides" : current.label}
        </p>
        <ul className="space-y-1.5">
          {(complete ? MILESTONES[4] : current).subtasks.slice(0, 5).map((s, i) => {
            const checked = complete || i < pos.done;
            const isNext = !complete && i === pos.done;
            return (
              <li key={s} className="flex items-center gap-2 text-xs">
                <span
                  className={`grid h-3.5 w-3.5 place-items-center rounded-sm border text-[9px] transition-colors duration-300 ${
                    checked ? "border-done/60 bg-done/25 text-done" : "border-edge bg-surface-3 text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span className={checked ? "text-ink-muted line-through decoration-ink-faint" : isNext ? "text-ink" : "text-ink-faint"}>
                  {s}
                </span>
                {isNext && <span className="ml-auto font-mono text-[9px] text-live animate-live">← ticking…</span>}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-edge pt-3 font-mono text-[10px] text-ink-faint">
        <span>ticked by</span>
        <span className="text-live">{complete ? "claude-code" : lastSource}</span>
        <span className="ml-auto">via POST /api/v1/rows/ZT-4821/subtasks</span>
      </div>
    </div>
  );
}
