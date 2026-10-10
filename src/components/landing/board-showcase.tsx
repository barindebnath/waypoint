"use client";

import { useState } from "react";
import { BoardCard, StaticPreviewProvider } from "@/components/board-card";
import { PIPELINE_STYLE } from "@/components/chip";
import {
  BoardIcon,
  BookIcon,
  ChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CodeIcon,
  CompassIcon,
  FlagIcon,
  FlaskIcon,
  LogoutIcon,
  MoonIcon,
  PlusIcon,
  RefreshIcon,
  ShieldCheckIcon,
  SlidersIcon,
  SparkleIcon,
  TimesheetIcon,
} from "@/components/icons";
import { LogoTile } from "@/components/logo";
import { TimesheetDayBadge } from "@/components/timesheet-footer";
import { COLUMNS, columnIndex } from "@/lib/board-columns";
import type { EnrichedRowView } from "@/lib/client-api";
import { sampleBoardRows, samplePreview } from "./board-fixtures";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** The look of each Board column: an icon on a pastel tile. The order matches COLUMNS. */
const LANE_STYLE = [
  { icon: CompassIcon, tile: "bg-chip-sky" },
  { icon: CodeIcon, tile: "bg-chip-lilac" },
  { icon: FlaskIcon, tile: "bg-chip-yellow" },
  { icon: ShieldCheckIcon, tile: "bg-chip-orange" },
  { icon: FlagIcon, tile: "bg-chip-mint" },
];

/** The four pages of the sidebar. Only the Board is active, and only the Board has a count. */
const NAV = [
  { label: "Board", icon: BoardIcon, active: true },
  { label: "Analytics", icon: ChartIcon, active: false },
  { label: "Settings", icon: SlidersIcon, active: false },
  { label: "Docs", icon: BookIcon, active: false },
];

/**
 * The classes that show a week of the timesheet bar. They go from the oldest week to the current week.
 * An old week shows only when the bar is wide enough for it, so the bar never cuts a week in two.
 * The current week always shows. The widths are the widths of the bar, not of the window.
 */
const WEEK_VISIBILITY = [
  "hidden @min-[1240px]:flex",
  "hidden @min-[1040px]:flex",
  "hidden @min-[860px]:flex",
  "flex",
];

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
 * The hero preview: the real app in a window. It has the sidebar, the Board header, the columns
 * (real BoardCard components) and the timesheet bar, all with sample data.
 * The cards are static, so nothing here calls the API.
 */
export function BoardShowcase() {
  // One time value for the whole render, so ages and dates agree.
  const [now] = useState(() => new Date());
  const [rows] = useState<EnrichedRowView[]>(() => sampleBoardRows(now.getTime()));
  const columns = COLUMNS.map((c) => ({ ...c, rows: [] as EnrichedRowView[] }));
  for (const r of rows) columns[columnIndex(r)].rows.push(r);

  // The filter of the Board header: all cards, then one filter for each pipeline.
  const filters = [
    { label: "All", dot: undefined as string | undefined, count: rows.length },
    ...Object.entries(PIPELINE_STYLE).map(([key, p]) => ({
      label: p.label,
      dot: p.dot as string | undefined,
      count: rows.filter((r) => r.pipelineKey === key).length,
    })),
  ];

  return (
    <div className="rounded-panel bg-desk p-2.5 text-left ring-1 ring-edge" aria-label="Preview of the Waypoint Board" role="img">
      <div className="flex gap-2.5">
        {/* Sidebar, as an icon rail. It shows from the sm size. */}
        <div className="hidden w-[68px] shrink-0 flex-col items-center rounded-3xl bg-bg py-4 sm:flex">
          <LogoTile className="h-11 w-11" />
          <div className="mt-6 flex flex-col items-center gap-1.5">
            {NAV.map((item) => (
              <span
                key={item.label}
                className={`relative grid h-11 w-11 place-items-center rounded-2xl ${
                  item.active ? "bg-surface-2 text-accent-fg" : "text-ink-muted"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.active && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-ink">
                    {rows.length}
                  </span>
                )}
              </span>
            ))}
          </div>
          {/* The account controls, at the bottom of the rail */}
          <div className="mt-auto flex flex-col items-center gap-2 pt-6">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-chip-lime text-sm font-bold text-chip-ink">A</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-ink-muted">
              <MoonIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-ink-muted">
              <LogoutIcon className="h-[18px] w-[18px]" />
            </span>
          </div>
        </div>

        {/* Main panel */}
        <div className="flex min-w-0 flex-1 flex-col rounded-3xl bg-bg">
          {/* The header of the Board page */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface text-accent-fg">
                <BoardIcon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="font-serif text-[24px] font-semibold leading-none tracking-tight text-ink sm:text-[28px]">Board</p>
                <p className="mt-1.5 text-[13px] text-ink-muted">{rows.length} in flight</p>
              </div>
            </div>

            {/* Filter by pipeline. It shows from the lg size. */}
            <div className="hidden items-center gap-1 rounded-full bg-surface p-1 lg:flex">
              {filters.map((f, i) => (
                <span
                  key={f.label}
                  className={`flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium ${
                    i === 0 ? "bg-accent text-accent-ink" : "text-ink-muted"
                  }`}
                >
                  {f.dot && <span className={`h-2 w-2 rounded-full ${f.dot}`} />}
                  {f.label}
                  <span className={`font-mono text-[11px] tabular-nums ${i === 0 ? "text-accent-ink/70" : "text-ink-faint"}`}>
                    {f.count}
                  </span>
                </span>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden h-10 items-center gap-2 rounded-2xl bg-surface px-3.5 text-xs font-medium text-ink-muted xl:inline-flex">
                <RefreshIcon className="h-4 w-4" />
                Synced 2m ago
              </span>
              <span className="inline-flex h-10 items-center gap-2 rounded-2xl bg-accent px-4 text-[13px] font-semibold text-accent-ink">
                <PlusIcon className="h-4 w-4" />
                New card
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-3 pb-3 sm:px-4 sm:pb-4">
            {/* Columns */}
            <StaticPreviewProvider resolve={samplePreview}>
              <div className="overflow-x-auto rounded-lane bg-lane p-3">
                <div className="grid auto-cols-[minmax(180px,1fr)] grid-flow-col gap-3">
                  {columns.map((col, i) => {
                    const style = LANE_STYLE[i] ?? LANE_STYLE[0];
                    return (
                      <div key={col.title} className="flex min-h-0 flex-col">
                        <div className="mb-3 flex min-h-9 items-center gap-2 px-1">
                          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-[10px] text-chip-ink ${style.tile}`}>
                            <style.icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1 text-[14px] font-semibold leading-tight tracking-tight text-ink">
                            {col.title}
                          </span>
                          <span className="shrink-0 rounded-full bg-surface-3 px-2 py-0.5 font-mono text-[11px] tabular-nums text-ink-muted">
                            {col.rows.length}
                          </span>
                        </div>
                        <div className="flex flex-col gap-3">
                          {col.rows.map((r) => (
                            <BoardCard key={r.id} row={r} preview />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </StaticPreviewProvider>

            <TimesheetBarPreview now={now} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The timesheet bar as the Board shows it: title and Fill, Mon–Fri date badges (the real
 * TimesheetDayBadge, today highlighted), and the month with its pager. `onFill` makes the Fill button clickable.
 * The bar fits itself to its own width, so it also looks right in a narrow column.
 */
export function TimesheetBarPreview({ now, onFill }: { now: Date; onFill?: () => void }) {
  const weeks = sampleWeeks(now);
  const month = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  // The Fill pill looks the same with and without `onFill`.
  const fillClass =
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-3.5 text-xs font-semibold text-accent-fg transition-colors";

  return (
    <div className="@container shrink-0">
      <div className="flex items-center gap-3 rounded-[22px] bg-surface px-3 py-2 @lg:gap-5 @lg:px-5">
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden select-none items-center gap-2 text-[13px] font-semibold text-ink @2xl:flex">
            <TimesheetIcon className="h-[18px] w-[18px] text-ink-muted" />
            Timesheets
          </span>
          {onFill ? (
            <button type="button" onClick={onFill} className={`${fillClass} cursor-pointer hover:bg-accent hover:text-accent-ink`}>
              <SparkleIcon className="h-3.5 w-3.5" />
              Fill
            </button>
          ) : (
            <span className={fillClass}>
              <SparkleIcon className="h-3.5 w-3.5" />
              Fill
            </span>
          )}
        </div>

        {/* The weeks. The vertical padding leaves room for the ring of today. */}
        <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden px-1 py-2">
          {weeks.map((week, i) => (
            <div key={i} className={`shrink-0 items-center gap-4 ${WEEK_VISIBILITY[i]}`}>
              <div className="flex gap-1">
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
              {/* A line between two weeks, as in the app */}
              {i < weeks.length - 1 && <span className="h-4 w-px shrink-0 bg-edge" aria-hidden="true" />}
            </div>
          ))}
        </div>

        {/* The month pager. It is only a picture, so the arrows are not buttons. The next month is dim, as in the app. */}
        <div className="hidden shrink-0 items-center gap-1 @xl:flex @xl:gap-2" aria-hidden="true">
          <span className="grid h-8 w-8 place-items-center rounded-full text-ink-muted">
            <ChevronLeftIcon className="h-4 w-4" />
          </span>
          <span className="flex min-w-[120px] select-none items-center justify-center text-[13px] font-semibold text-ink-muted">
            {month}
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full text-ink-muted opacity-30">
            <ChevronRightIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
