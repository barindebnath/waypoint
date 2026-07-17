"use client";

/**
 * Theme preference store: "system" | "light" | "dark", persisted per device
 * in localStorage ("wp-theme"). The resolved theme lands on
 * <html data-theme="light|dark">; layout.tsx applies it pre-paint.
 */

export type ThemePref = "system" | "light" | "dark";

const KEY = "wp-theme";
const listeners = new Set<() => void>();
let mqBound = false;

export function getThemePref(): ThemePref {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(KEY);
  return v === "light" || v === "dark" ? v : "system";
}

export function applyTheme(pref: ThemePref) {
  const resolved =
    pref === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : pref;
  document.documentElement.setAttribute("data-theme", resolved);
}

export function setThemePref(pref: ThemePref) {
  localStorage.setItem(KEY, pref);
  applyTheme(pref);
  listeners.forEach((fn) => fn());
}

export function cycleThemePref(): ThemePref {
  const order: ThemePref[] = ["system", "light", "dark"];
  const next = order[(order.indexOf(getThemePref()) + 1) % order.length];
  setThemePref(next);
  return next;
}

/** For useSyncExternalStore — also re-applies on OS theme change while in "system". */
export function subscribeTheme(fn: () => void): () => void {
  listeners.add(fn);
  if (!mqBound && typeof window !== "undefined") {
    mqBound = true;
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (getThemePref() === "system") applyTheme("system");
      });
  }
  return () => listeners.delete(fn);
}

export const THEME_GLYPHS: Record<ThemePref, string> = {
  system: "◐",
  light: "☀",
  dark: "☾",
};
