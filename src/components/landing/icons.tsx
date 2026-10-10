import type { ReactNode } from "react";
import {
  ArrowRightIcon as SoftArrowRightIcon,
  CalendarIcon as SoftCalendarIcon,
  ChartIcon as SoftChartIcon,
  CheckCircleIcon as SoftCheckCircleIcon,
  CheckIcon as SoftCheckIcon,
  ChevronDownIcon as SoftChevronDownIcon,
  CopyIcon as SoftCopyIcon,
  PullRequestIcon as SoftPullRequestIcon,
  RefreshIcon as SoftRefreshIcon,
  ShieldCheckIcon as SoftShieldCheckIcon,
  SparkleIcon as SoftSparkleIcon,
} from "@/components/icons";

/**
 * The icons of the landing page.
 * Every name of the old feather-style set stays, so the call sites do not change.
 * A name that has a match in the shared set (src/components/icons.tsx) draws that soft icon.
 * The other names are drawn here in the same style: 24px grid, stroke 1.7, round caps and round joins.
 * Size an icon with a class, for example `h-4 w-4`. That size is also the default.
 */
type IconProps = { className?: string };

/** The frame of a local icon. It has the same attributes as the shared icons. */
function LocalSvg({ className = "h-4 w-4", children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

/**
 * A drawing that fills the whole 24px grid is scaled down a little.
 * Then it has the same margin as the shared icons. The stroke stays 1.7 after the scale.
 */
function Fit({ children }: { children: ReactNode }) {
  return (
    <g transform="translate(12 12) scale(0.88) translate(-12 -12)" strokeWidth={1.93}>
      {children}
    </g>
  );
}

/* ---------- Icons that the shared set has ---------- */

export function GitPullRequestIcon({ className = "h-4 w-4" }: IconProps) {
  return <SoftPullRequestIcon className={className} />;
}

export function RefreshIcon({ className = "h-4 w-4" }: IconProps) {
  return <SoftRefreshIcon className={className} />;
}

export function CheckCircleIcon({ className = "h-4 w-4" }: IconProps) {
  return <SoftCheckCircleIcon className={className} />;
}

export function ShieldCheckIcon({ className = "h-4 w-4" }: IconProps) {
  return <SoftShieldCheckIcon className={className} />;
}

export function SparklesIcon({ className = "h-4 w-4" }: IconProps) {
  return <SoftSparkleIcon className={className} />;
}

export function CopyIcon({ className = "h-4 w-4" }: IconProps) {
  return <SoftCopyIcon className={className} />;
}

export function CheckIcon({ className = "h-4 w-4" }: IconProps) {
  return <SoftCheckIcon className={className} />;
}

export function CalendarIcon({ className = "h-4 w-4" }: IconProps) {
  return <SoftCalendarIcon className={className} />;
}

export function BarChart3Icon({ className = "h-4 w-4" }: IconProps) {
  return <SoftChartIcon className={className} />;
}

export function ArrowRightIcon({ className = "h-4 w-4" }: IconProps) {
  return <SoftArrowRightIcon className={className} />;
}

export function ChevronDownIcon({ className = "h-4 w-4" }: IconProps) {
  return <SoftChevronDownIcon className={className} />;
}

/* ---------- Icons that the shared set does not have ---------- */

/** A bug: a round body with two feelers and six legs. */
export function BugIcon({ className }: IconProps) {
  return (
    <LocalSvg className={className}>
      <path d="M7.5 12a4.5 4.5 0 0 1 9 0v4a4.5 4.5 0 0 1-9 0z" />
      <path d="M9.8 8.2 8.3 5M14.2 8.2 15.7 5M7.5 13H4M16.5 13H20M8.1 9.6 5 8M15.9 9.6 19 8M8 17.4l-2.8 1.8M16 17.4l2.8 1.8" />
    </LocalSvg>
  );
}

/** A wrench. */
export function WrenchIcon({ className }: IconProps) {
  return (
    <LocalSvg className={className}>
      <Fit>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </Fit>
    </LocalSvg>
  );
}

/** A terminal window with a prompt. */
export function TerminalIcon({ className }: IconProps) {
  return (
    <LocalSvg className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="4.5" />
      <path d="m8 10 2.5 2L8 14M12.5 14.2H16" />
    </LocalSvg>
  );
}

/** A painter palette. */
export function PaletteIcon({ className }: IconProps) {
  return (
    <LocalSvg className={className}>
      <Fit>
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z" />
      </Fit>
    </LocalSvg>
  );
}

/** Two triangles that point to the right. */
export function FastForwardIcon({ className }: IconProps) {
  return (
    <LocalSvg className={className}>
      <path d="M4 7.5v9l6.5-4.5zM12.5 7.5v9l6.5-4.5z" />
    </LocalSvg>
  );
}

/** An arrow that turns to the left. */
export function RotateCcwIcon({ className }: IconProps) {
  return (
    <LocalSvg className={className}>
      <Fit>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </Fit>
    </LocalSvg>
  );
}
