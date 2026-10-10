"use client";

import { useState } from "react";
import { BookIcon, CalendarIcon, SlidersIcon } from "@/components/icons";
import { AutoTempoFeedback } from "@/components/timesheet-footer";
import type { AutoTempoResult } from "@/lib/timesheet-shared";
import { TimesheetBarPreview } from "./board-showcase";

/** The last two weekdays before `now`, as yyyy-MM-dd. */
function lastWeekdays(now: Date): string[] {
  const out: string[] = [];
  const d = new Date(now);
  while (out.length < 2) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) out.unshift(d.toLocaleDateString("en-CA"));
  }
  return out;
}

/** A sample AutoTempo run: Board cards and a meeting, mapped to investment accounts. */
function sampleResult(now: Date): AutoTempoResult {
  const [d1, d2] = lastWeekdays(now);
  const item = (id: string, date: string, type: "card" | "meeting", title: string, hours: number, accountName: string, ref?: string) => ({
    id, date, type, title, ref, issueId: id, account: accountName.toUpperCase().replace(/\W+/g, "-"), accountName, seconds: hours * 3600, hours,
  });
  const days = [
    { date: d1, worklogs: [item("w1", d1, "card", "Support multi-region token exchange", 5, "Capex Feature", "OFF-13698"), item("w2", d1, "meeting", "Sprint planning", 1, "Overhead"), item("w3", d1, "card", "Invoice PDF tax total", 2, "BAU Support", "ZT-2041")] },
    { date: d2, worklogs: [item("w4", d2, "card", "Webhook retries with backoff", 6, "Capex Feature", "OFF-13655"), item("w5", d2, "meeting", "Team stand-up", 0.5, "Overhead"), item("w6", d2, "card", "Session expires after reset", 1.5, "BAU Support", "ZT-2057")] },
  ].map((d) => ({ ...d, totalHours: d.worklogs.reduce((s, w) => s + w.hours, 0), totalSeconds: d.worklogs.reduce((s, w) => s + w.seconds, 0) }));
  return {
    success: true,
    processedDates: [d1, d2],
    worklogsCreated: 6,
    totalSecondsLogged: days.reduce((s, d) => s + d.totalSeconds, 0),
    days,
    diagnostics: [],
    messages: [],
  };
}

/** The three AutoTempo rules under the bar. Each one has a pastel icon tile, as the Board columns have. */
const RULES = [
  {
    icon: SlidersIcon,
    tile: "bg-chip-lilac",
    title: "Account Rule Engine",
    text: "Maps card origins to designated investment codes (Support vs Capex Feature).",
  },
  {
    icon: BookIcon,
    tile: "bg-chip-yellow",
    title: "Enterprise Categories",
    text: "Full support for official investment categories required for corporate capitalization.",
  },
  {
    icon: CalendarIcon,
    tile: "bg-chip-mint",
    title: "Skip Days & Holidays",
    text: "Automatically respects vacation periods and bank holidays without manual overrides.",
  },
];

/**
 * The timesheet bar from the Board, with the real AutoTempo result card.
 * Fill shows a sample result. Nothing here calls the API.
 */
export function TimesheetShowcase() {
  const [now] = useState(() => new Date());
  const [result, setResult] = useState<AutoTempoResult | null>(() => sampleResult(now));

  return (
    <div className="w-full space-y-3">
      {/* The bar sits on the panel and the result card sits inside the bar, as in the app. */}
      <div className="rounded-[22px] bg-surface">
        {result && (
          <div className="px-3 pt-3 sm:px-5">
            <AutoTempoFeedback result={result} onDismiss={() => setResult(null)} />
          </div>
        )}
        <TimesheetBarPreview now={now} onFill={() => setResult(sampleResult(now))} />
      </div>

      {/* AutoTempo Rules Preview */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {RULES.map((rule) => (
          <div key={rule.title} className="rounded-2xl bg-surface p-4">
            <span className={`grid h-9 w-9 place-items-center rounded-xl text-chip-ink ${rule.tile}`}>
              <rule.icon className="h-[18px] w-[18px]" />
            </span>
            <div className="mt-3 text-[13px] font-semibold text-ink">{rule.title}</div>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{rule.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
