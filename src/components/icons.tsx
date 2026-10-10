import type { ReactNode, SVGProps } from "react";

/**
 * The Waypoint icon set. Soft outline icons on a 24px grid: round caps, round joins and
 * rounded corners. Each icon takes the colour of the text around it (currentColor).
 * Size an icon with a class (`h-4 w-4`) or with the `size` prop. An icon is decorative by
 * default (aria-hidden). Put the label on the button that holds the icon.
 */
export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number | string };

function Svg({ size = 20, strokeWidth = 1.7, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ---------- Navigation ---------- */

/** Three columns that hang from the top: the Board. */
export function BoardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3.5" width="18" height="17" rx="5" />
      <path d="M7.5 8.5v4M12 8.5v7M16.5 8.5v2.5" />
    </Svg>
  );
}

/** Bars that rise from the bottom: Analytics. */
export function ChartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3.5" width="18" height="17" rx="5" />
      <path d="M8 15.5v-3M12 15.5V9M16 15.5V11" />
    </Svg>
  );
}

/** Two sliders: Settings. */
export function SlidersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h8.5M17.5 7H20M4 17h2.5M11.5 17H20" />
      <circle cx="15" cy="7" r="2.4" />
      <circle cx="9" cy="17" r="2.4" />
    </Svg>
  );
}

/** An open book: Docs. */
export function BookIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 6.5c-1.6-1.3-3.7-2-6.2-2-.8 0-1.3.5-1.3 1.2V17c0 .6.5 1 1.1 1 2.3 0 4.3.5 6.4 1.8 2.1-1.3 4.1-1.8 6.4-1.8.6 0 1.1-.4 1.1-1V5.7c0-.7-.5-1.2-1.3-1.2-2.5 0-4.6.7-6.2 2z" />
      <path d="M12 6.5v13.3" />
    </Svg>
  );
}

export function SidebarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="4.5" />
      <path d="M9.5 4.5v15" />
    </Svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </Svg>
  );
}

/* ---------- Actions ---------- */

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.8-3.8" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2.2} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.3 2.4 2.4 4.6-5" />
    </Svg>
  );
}

export function DotsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="18" cy="12" r="1.2" fill="currentColor" />
    </Svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6.5h16M7 12h10M10 17.5h4" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 7h15M10 7V5.5A1.5 1.5 0 0 1 11.5 4h1A1.5 1.5 0 0 1 14 5.5V7M6.5 7l.8 11.1A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.9L17.5 7" />
    </Svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 11.5A8 8 0 0 0 5.8 7M4 4v3.5h3.5" />
      <path d="M4 12.5A8 8 0 0 0 18.2 17M20 20v-3.5h-3.5" />
    </Svg>
  );
}

export function UndoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 14 4.5 9.5 9 5" />
      <path d="M4.5 9.5H15a4.5 4.5 0 0 1 0 9h-2" />
    </Svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m11 4 1.7 4.6L17.3 10l-4.6 1.4L11 16l-1.7-4.6L4.7 10l4.6-1.4z" />
      <path d="M18 15.5v4M16 17.5h4" />
    </Svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="3.5" />
      <path d="M15.5 8.5V7A3.5 3.5 0 0 0 12 3.5H7A3.5 3.5 0 0 0 3.5 7v5A3.5 3.5 0 0 0 7 15.5h1.5" />
    </Svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 3 5.5 13.2a.8.8 0 0 0 .65 1.3H11l-1 6.5 7.5-10.2a.8.8 0 0 0-.65-1.3H12z" />
    </Svg>
  );
}

/* ---------- Direction ---------- */

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="m14.5 6-6 6 6 6" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="m9.5 6 6 6-6 6" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Svg>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </Svg>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </Svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 16 16 8M9 8h7v7" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

/* ---------- Things ---------- */

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="4.5" />
      <path d="M8 3v3.5M16 3v3.5M3.5 10.5h17" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />
    </Svg>
  );
}

export function PullRequestIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="M6 8.4v9.2M12.5 6H15a3 3 0 0 1 3 3v6.6" />
    </Svg>
  );
}

export function TimesheetIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="4.5" width="14" height="16" rx="4" />
      <path d="M9.5 4.5V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v.5M9 12.5h6M9 16h3.5" />
    </Svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </Svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.3 4.9 3.7 16.5A2 2 0 0 0 5.4 19.5h13.2a2 2 0 0 0 1.7-3L13.7 4.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4M12 16.4h.01" />
    </Svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8.5" r="3.7" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Svg>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8M16 7l2.5 2.5M14 9l2 2" />
    </Svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </Svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.6 5.7A9.4 9.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.3M6.7 7.3A15.7 15.7 0 0 0 2.5 12s3.5 6.5 9.5 6.5c1.4 0 2.7-.4 3.8-.9" />
      <path d="M9.9 9.9a2.8 2.8 0 0 0 4 4M4 4l16 16" />
    </Svg>
  );
}

/* ---------- Theme ---------- */

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21M5.6 5.6l1.3 1.3M17.1 17.1l1.3 1.3M18.4 5.6l-1.3 1.3M6.9 17.1l-1.3 1.3" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2z" />
    </Svg>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4.5" width="17" height="11.5" rx="3.5" />
      <path d="M9 20h6M12 16v4" />
    </Svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.5 20H7a3.5 3.5 0 0 1-3.5-3.5v-9A3.5 3.5 0 0 1 7 4h2.5" />
      <path d="m15 8 4 4-4 4M19 12H9.5" />
    </Svg>
  );
}

/* ---------- Board stages (one icon for each Board column) ---------- */

/** Triage / Definition */
export function CompassIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.8 8.2-2 5.6-5.6 2 2-5.6z" />
    </Svg>
  );
}

/** Development */
export function CodeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.2 5.5l-2.4 13" />
    </Svg>
  );
}

/** Staging */
export function FlaskIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.5 4h5M10.5 4v5.2l-5.1 8.6A2 2 0 0 0 7.1 21h9.8a2 2 0 0 0 1.7-3.2l-5.1-8.6V4" />
      <path d="M8 15h8" />
    </Svg>
  );
}

/** QA & Review */
export function ShieldCheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 5 6v5.5c0 4.3 2.9 7.3 7 9 4.1-1.7 7-4.7 7-9V6z" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" />
    </Svg>
  );
}

/** Production & Close-out */
export function FlagIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 21V4.5M6 5h10.5l-2 3.8 2 3.8H6" />
    </Svg>
  );
}
