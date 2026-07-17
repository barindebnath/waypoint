"use client";

import { useSyncExternalStore } from "react";
import { cycleThemePref, getThemePref, subscribeTheme, THEME_GLYPHS } from "@/lib/theme";

export function ThemeToggle() {
  const pref = useSyncExternalStore(subscribeTheme, getThemePref, () => "system" as const);
  return (
    <button
      onClick={() => cycleThemePref()}
      title={`Theme: ${pref} (click to cycle, or pick in Settings)`}
      suppressHydrationWarning
      className="h-[26px] w-[26px] self-center rounded-full border border-edge text-xs leading-none text-ink-muted hover:border-edge-strong"
    >
      {THEME_GLYPHS[pref]}
    </button>
  );
}
