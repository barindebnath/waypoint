"use client";

import { useState } from "react";
import { CheckCircleIcon, CalendarIcon, SparklesIcon, RotateCcwIcon } from "./icons";

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
    <div className="w-full rounded-2xl border border-edge bg-surface p-5 sm:p-7 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-edge pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-accent" />
            <h3 className="font-serif text-base font-semibold text-ink">
              Weekly Tempo Attestation & AutoTempo
            </h3>
          </div>
          <p className="text-xs text-ink-muted">
            Attest that daily time was logged in Tempo. Unlocks weekly submission when all 5 days are complete.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyAutoTempo}
            className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20 cursor-pointer"
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

      {/* Attestation Strip */}
      <div className="mt-5 rounded-xl border border-edge bg-surface-2 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-ink">Week 2026-W34</span>
            <span className="text-[11px] text-ink-faint">· Mon–Fri Logging Strip</span>
          </div>

          {/* Submission badge */}
          {isSubmitted ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-done/40 bg-done-soft px-3 py-0.5 font-mono text-xs font-semibold text-done">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              <span>Week Submitted & Locked</span>
            </span>
          ) : (
            <span className="font-mono text-xs text-ink-muted">
              {Object.values(checkedDays).filter(Boolean).length}/5 Days Logged
            </span>
          )}
        </div>

        {/* 5-day Buttons */}
        <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3">
          {DAYS.map((d) => {
            const checked = checkedDays[d.key];
            return (
              <button
                key={d.key}
                onClick={() => toggleDay(d.key)}
                disabled={isSubmitted}
                className={`flex flex-col items-center justify-center rounded-xl border p-2.5 sm:p-3 transition-all ${
                  checked
                    ? "border-done bg-done-soft text-ink font-semibold shadow-xs"
                    : "border-edge bg-surface text-ink-muted hover:border-edge-strong hover:text-ink"
                } ${isSubmitted ? "cursor-default opacity-80" : "cursor-pointer"}`}
              >
                <span className="text-[11px] uppercase font-mono tracking-wider">{d.label}</span>
                <span className="text-xs text-ink-faint mt-0.5 hidden sm:inline">{d.date}</span>
                <span
                  className={`mt-2 flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
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

        {/* Submit Action */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-edge pt-4">
          <div className="text-xs text-ink-faint">
            {allDaysChecked
              ? "All 5 days verified. Ready for weekly Tempo submission."
              : "Check all 5 weekdays to enable Tempo week submission."}
          </div>

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
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
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
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-edge bg-surface-2 p-3.5">
          <div className="font-serif text-xs font-semibold text-ink">Configured Account Rules</div>
          <p className="text-[11.5px] text-ink-muted mt-1">
            Auto-assigns default Tempo accounts based on card origin: Support (BAU) vs Product (Capex).
          </p>
        </div>
        <div className="rounded-xl border border-edge bg-surface-2 p-3.5">
          <div className="font-serif text-xs font-semibold text-ink">Official Investment Categories</div>
          <p className="text-[11.5px] text-ink-muted mt-1">
            Built-in support for official enterprise investment categorization required for financial reporting.
          </p>
        </div>
        <div className="rounded-xl border border-edge bg-surface-2 p-3.5">
          <div className="font-serif text-xs font-semibold text-ink">Skip Days & Holidays</div>
          <p className="text-[11.5px] text-ink-muted mt-1">
            AutoTempo automatically skips bank holidays and designated vacation days without false ticks.
          </p>
        </div>
      </div>
    </div>
  );
}
