"use client";

import { useState } from "react";
import { BoardCard, StaticPreviewProvider } from "@/components/board-card";
import { TimesheetDayBadge } from "@/components/timesheet-footer";
import { COLUMNS, columnIndex } from "@/lib/board-columns";
import type { EnrichedRowView } from "@/lib/client-api";
import { sampleBoardRows, samplePreview } from "./board-fixtures";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** Mon–Fri dates for this week and the three weeks before it. Past days are filled. */
function sampleWeeks(now: Date) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return [3, 2, 1, 0].map((back) =>
    DAY_LABELS.map((_, d) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() - back * 7 + d);
      return { date, filled: date < now && date.toDateString() !== now.toDateString(), today: date.toDateString() === now.toDateString() };
    }),
  );
}

/**
 * The hero preview: the real Board (nav, header, columns of real BoardCard components, timesheet bar)
 * with sample data. The cards are static, so nothing here calls the API.
 */
export function BoardShowcase() {
  // One time value for the whole render, so ages and dates agree.
  const [now] = useState(() => new Date());
  const [rows] = useState<EnrichedRowView[]>(() => sampleBoardRows(now.getTime()));
  const columns = COLUMNS.map((c) => ({ ...c, rows: [] as EnrichedRowView[] }));
  for (const r of rows) columns[columnIndex(r)].rows.push(r);

  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-bg text-left shadow-card" aria-label="Preview of the Waypoint Board" role="img">
      {/* Nav */}
      <div className="flex items-center gap-5 border-b border-edge/60 bg-surface/85 px-4 py-2">
        <span className="font-serif text-sm font-semibold text-ink">Waypoint</span>
        <span className="hidden sm:flex gap-1.5">
          {["Board", "Analytics", "Settings", "Docs"].map((t) => (
            <span
              key={t}
              className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${t === "Board" ? "bg-accent text-accent-ink" : "text-ink-muted"}`}
            >
              {t}
            </span>
          ))}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-baseline gap-3 px-4 pt-4 pb-3">
        <span className="font-serif text-2xl font-medium tracking-tight text-ink">Board</span>
        <span className="font-serif text-sm italic text-ink-muted">{rows.length} in flight</span>
        <span className="ml-auto font-mono text-[11px] text-ink-faint">Synced 2m ago</span>
        <span className="self-center rounded-full border border-edge bg-surface px-3 py-1 text-[11px] font-semibold text-ink-muted">
          + New card
        </span>
      </div>

      {/* Columns */}
      <StaticPreviewProvider resolve={samplePreview}>
        <div className="grid grid-flow-col auto-cols-[minmax(220px,1fr)] gap-3 overflow-x-auto px-4 pb-4">
          {columns.map((col) => (
            <section key={col.title} className="flex min-h-[200px] flex-col rounded-xl border border-edge bg-surface-2/60 p-2.5">
              <header className="mb-2.5 flex items-baseline justify-between px-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-muted">{col.title}</span>
                <span className="font-mono text-[11px] text-ink-faint">{col.rows.length}</span>
              </header>
              <div className="flex flex-col gap-2">
                {col.rows.map((r) => (
                  <BoardCard key={r.id} row={r} preview />
                ))}
              </div>
            </section>
          ))}
        </div>
      </StaticPreviewProvider>

      <TimesheetBarPreview now={now} />
    </div>
  );
}

/**
 * The timesheet bar as the Board shows it: title and Fill, Mon–Fri date badges (the real
 * TimesheetDayBadge, today highlighted), and the month. `onFill` makes the Fill button clickable.
 */
export function TimesheetBarPreview({ now, onFill }: { now: Date; onFill?: () => void }) {
  const weeks = sampleWeeks(now);
  const month = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return (
    <div className="flex items-center gap-4 border-t border-edge bg-surface/95 px-4 py-2">
      <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.16em] text-ink">Timesheets</span>
      {onFill ? (
        <button
          type="button"
          onClick={onFill}
          className="cursor-pointer rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-bold text-accent hover:bg-accent hover:text-accent-ink transition-all"
        >
          Fill
        </button>
      ) : (
        <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-bold text-accent">Fill</span>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-5 overflow-hidden pt-1 pb-2">
        {weeks.map((week, i) => (
          <div key={i} className="flex shrink-0 gap-1">
            {week.map((d) => (
              <TimesheetDayBadge
                key={d.date.toISOString()}
                dayLabel={String(d.date.getDate())}
                checked={d.filled}
                title={d.date.toDateString()}
                isToday={d.today}
              />
            ))}
          </div>
        ))}
      </div>
      <span className="hidden sm:inline shrink-0 text-xs font-semibold text-ink-muted">‹ {month} ›</span>
    </div>
  );
}
