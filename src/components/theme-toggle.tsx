"use client";

import { useSyncExternalStore } from "react";
import { cycleThemePref, getThemePref, subscribeTheme, type ThemePref } from "@/lib/theme";
import { MonitorIcon, MoonIcon, SunIcon } from "./icons";

const ICONS: Record<ThemePref, typeof SunIcon> = {
  system: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon,
};

/** A round button that cycles the theme: system, light, dark. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const pref = useSyncExternalStore(subscribeTheme, getThemePref, () => "dark" as const);
  const Icon = ICONS[pref];
  return (
    <button
      type="button"
      onClick={() => cycleThemePref()}
      title={`Theme: ${pref} (click to change, or pick in Settings)`}
      aria-label={`Theme: ${pref}. Click to change.`}
      suppressHydrationWarning
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink ${className}`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}
