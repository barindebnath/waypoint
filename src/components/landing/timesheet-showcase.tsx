"use client";

import { useState } from "react";
import { CheckCircleIcon, CalendarIcon, SparklesIcon } from "./icons";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri";

const DAYS: { key: DayKey; label: string; date: string }[] = [
  { key: "mon", label: "Mon", date: "Aug 18" },
  { key: "tue", label: "Tue", date: "Aug 19" },
  { key: "wed", label: "Wed", date: "Aug 20" },
  { key: "thu", label: "Thu", date: "Aug 21" },
  { key: "fri", label: "Fri", date: "Aug 22" },
];

export function TimesheetShowcase() {
  const [checkedDays, setCheckedDays] = useState<Record<DayKey, boolean>>({
    mon: true,
    tue: true,
    wed: true,
    thu: false,
    fri: false,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const allDaysChecked = DAYS.every((d) => checkedDays[d.key]);

  const toggleDay = (key: DayKey) => {
    if (isSubmitted) return;
    setCheckedDays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApplyAutoTempo = () => {
    setCheckedDays({
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
    });
  };

  const handleReset = () => {
    setCheckedDays({
      mon: true,
      tue: true,
      wed: true,
      thu: false,
      fri: false,
    });
    setIsSubmitted(false);
  };

  return (
    <div className="w-full rounded-2xl border border-edge bg-surface p-5 sm:p-6 shadow-card space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-edge pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-semibold text-ink">
              Weekly Tempo Attestation Strip
            </h3>
            <span className="rounded-full bg-accent-soft text-accent px-2 py-0.5 font-mono text-[10.5px] font-semibold">
              Mon–Fri Flow
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Click each day to confirm Tempo logging. Submission unlocks when all 5 days are complete.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleApplyAutoTempo}
            className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent-soft px-2.5 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20 cursor-pointer"
          >
            <SparklesIcon className="h-3 w-3" />
            <span>Simulate AutoTempo</span>
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-edge bg-surface-2 px-2.5 py-1.5 text-xs text-ink-muted hover:text-ink cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Attestation Row */}
      <div className="rounded-xl border border-edge bg-surface-2 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-ink">Week 2026-W34</span>
            <span className="text-[11px] text-ink-faint">· Tempo Attestation</span>
          </div>

          {isSubmitted ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-done/30 bg-done-soft px-2.5 py-0.5 font-mono text-[11px] font-semibold text-done">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              <span>Week Submitted</span>
            </span>
          ) : (
            <span className="font-mono text-xs text-ink-muted">
              {Object.values(checkedDays).filter(Boolean).length} of 5 Days Logged
            </span>
          )}
        </div>

        {/* 5 Day Squares */}
        <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
          {DAYS.map((d) => {
            const checked = checkedDays[d.key];
            return (
              <button
                key={d.key}
                onClick={() => toggleDay(d.key)}
                disabled={isSubmitted}
                className={`flex flex-col items-center justify-center rounded-xl border py-2.5 px-1 sm:py-3 transition-all ${
                  checked
                    ? "border-done bg-done-soft text-ink shadow-xs"
                    : "border-edge bg-surface text-ink-muted hover:border-edge-strong hover:text-ink"
                } ${isSubmitted ? "cursor-default opacity-85" : "cursor-pointer"}`}
              >
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">{d.label}</span>
                <span className="text-[10.5px] text-ink-faint hidden sm:inline">{d.date}</span>
                <span
                  className={`mt-1.5 flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-bold ${
                    checked
                      ? "border-done bg-done text-surface"
                      : "border-edge-strong bg-surface-2 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-edge pt-3 text-xs">
          <span className="text-ink-faint text-[11.5px]">
            {allDaysChecked
              ? "All 5 days verified. Ready for Tempo week submission."
              : "Check all 5 weekdays to enable Tempo week submission."}
          </span>

          {isSubmitted ? (
            <button
              onClick={() => setIsSubmitted(false)}
              className="rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs text-ink-muted hover:text-ink cursor-pointer"
            >
              Reopen Week (Unsubmit)
            </button>
          ) : (
            <button
              onClick={() => setIsSubmitted(true)}
              disabled={!allDaysChecked}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                allDaysChecked
                  ? "bg-done text-surface shadow-xs hover:opacity-90 cursor-pointer"
                  : "bg-surface-3 text-ink-faint cursor-not-allowed"
              }`}
            >
              Submit Week to Tempo →
            </button>
          )}
        </div>
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
