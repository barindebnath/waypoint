"use client";

import { useState } from "react";

export type DateRange = {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getToday(): string {
  return toIsoDate(new Date());
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toIsoDate(d);
}

function getMondayOfThisWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  return toIsoDate(d);
}

function getFridayOfThisWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 4;
  d.setDate(diff);
  return toIsoDate(d);
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PRESETS = [
  { label: "Today", getRange: () => ({ from: getToday(), to: getToday() }) },
  { label: "Yesterday", getRange: () => ({ from: getDaysAgo(1), to: getDaysAgo(1) }) },
  { label: "7 Days", getRange: () => ({ from: getDaysAgo(6), to: getToday() }) },
  { label: "30 Days", getRange: () => ({ from: getDaysAgo(29), to: getToday() }) },
  { label: "This Week", getRange: () => ({ from: getMondayOfThisWeek(), to: getFridayOfThisWeek() }) },
];

export function DateRangePicker({
  value,
  onApply,
  onClear,
}: {
  value: DateRange | null;
  onApply: (range: DateRange) => void;
  onClear?: () => void;
}) {
  const initialDate = value?.from ? new Date(`${value.from}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const [start, setStart] = useState<string | null>(value?.from ?? null);
  const [end, setEnd] = useState<string | null>(value?.to ?? null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Calendar grid calculations
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startOffset = (firstDayOfWeek + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handleDateClick = (dateStr: string) => {
    if (!start || (start && end)) {
      setStart(dateStr);
      setEnd(null);
    } else {
      if (dateStr < start) {
        setEnd(start);
        setStart(dateStr);
      } else {
        setEnd(dateStr);
      }
    }
  };

  const handlePreset = (p: (typeof PRESETS)[number]) => {
    const range = p.getRange();
    setStart(range.from);
    setEnd(range.to);
    const d = new Date(`${range.from}T00:00:00`);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    onApply(range);
  };

  const effectiveStart = start;
  const effectiveEnd = end ?? (hovered && start && hovered >= start ? hovered : start);

  const isSelectedStart = (dStr: string) => effectiveStart === dStr;
  const isSelectedEnd = (dStr: string) => (end ? end === dStr : start === dStr);
  const isInRange = (dStr: string) => {
    if (!effectiveStart || !effectiveEnd) return false;
    return dStr >= effectiveStart && dStr <= effectiveEnd;
  };

  const canApply = start !== null;

  return (
    <div className="space-y-2.5">
      {/* Quick Presets */}
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => {
          const range = p.getRange();
          const active = start === range.from && (end === range.to || (!end && range.from === range.to));
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePreset(p)}
              className={`rounded-md px-2 py-0.5 text-[10.5px] font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-accent text-accent-ink font-semibold"
                  : "border border-edge bg-surface-2 text-ink-muted hover:border-edge-strong hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Mini Calendar */}
      <div className="rounded-lg border border-edge bg-surface-2/60 p-2 text-xs">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 rounded hover:bg-surface-3 text-ink-muted hover:text-ink cursor-pointer transition-colors"
            title="Previous month"
          >
            ‹
          </button>
          <span className="font-semibold text-[11.5px] text-ink">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded hover:bg-surface-3 text-ink-muted hover:text-ink cursor-pointer transition-colors"
            title="Next month"
          >
            ›
          </button>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-ink-faint mb-1">
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
          <span>Su</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px]">
          {Array.from({ length: startOffset }).map((_, i) => (
            <span key={`empty-${i}`} className="h-6" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(dayNum)}`;
            const isStart = isSelectedStart(dateStr);
            const isEnd = isSelectedEnd(dateStr);
            const inR = isInRange(dateStr);
            const isToday = dateStr === getToday();

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleDateClick(dateStr)}
                onMouseEnter={() => setHovered(dateStr)}
                onMouseLeave={() => setHovered(null)}
                className={`h-6 w-full rounded flex items-center justify-center cursor-pointer transition-all duration-100 ${
                  isStart || isEnd
                    ? "bg-accent !text-accent-ink font-bold shadow-xs"
                    : inR
                      ? "bg-accent/15 text-accent font-medium"
                      : isToday
                        ? "border border-accent/40 font-bold text-accent hover:bg-surface-3"
                        : "text-ink hover:bg-surface-3"
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Range Display & Actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="min-w-0 font-mono text-[11px] text-ink-muted truncate">
          {start ? (
            <span>
              {start}
              {end && end !== start ? ` → ${end}` : " (1 day)"}
            </span>
          ) : (
            <span className="italic text-ink-faint">No range selected</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onClear && value && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-[6px] border border-edge px-2 py-1 text-[11px] font-medium text-ink-muted hover:text-danger hover:border-danger/40 cursor-pointer transition-colors"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            disabled={!canApply}
            onClick={() => {
              if (start) {
                onApply({ from: start, to: end ?? start });
              }
            }}
            className="rounded-[6px] bg-accent px-3 py-1 text-[11px] font-semibold text-accent-ink hover:opacity-90 disabled:opacity-40 cursor-pointer transition-opacity"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
