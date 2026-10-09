"use client";

import { useState } from "react";
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

/**
 * The timesheet bar from the Board, with the real AutoTempo result card.
 * Fill shows a sample result. Nothing here calls the API.
 */
export function TimesheetShowcase() {
  const [now] = useState(() => new Date());
  const [result, setResult] = useState<AutoTempoResult | null>(() => sampleResult(now));

  return (
    <div className="w-full rounded-2xl border border-edge bg-surface p-5 sm:p-6 shadow-card space-y-4">
      <div className="overflow-hidden rounded-xl border border-edge">
        {result && (
          <div className="bg-surface/95 px-3 pt-3">
            <AutoTempoFeedback result={result} onDismiss={() => setResult(null)} />
          </div>
        )}
        <TimesheetBarPreview now={now} onFill={() => setResult(sampleResult(now))} />
      </div>

      {/* AutoTempo Rules Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="rounded-xl border border-edge bg-surface-2 p-3">
          <div className="font-serif font-semibold text-ink">Account Rule Engine</div>
          <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
            Maps card origins to designated investment codes (Support vs Capex Feature).
          </p>
        </div>
        <div className="rounded-xl border border-edge bg-surface-2 p-3">
          <div className="font-serif font-semibold text-ink">Enterprise Categories</div>
          <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
            Full support for official investment categories required for corporate capitalization.
          </p>
        </div>
        <div className="rounded-xl border border-edge bg-surface-2 p-3">
          <div className="font-serif font-semibold text-ink">Skip Days & Holidays</div>
          <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
            Automatically respects vacation periods and bank holidays without manual overrides.
          </p>
        </div>
      </div>
    </div>
  );
}
