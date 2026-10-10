"use client";

export type FontThemePref = "serif" | "sans" | "mono";

const KEY = "wp-font-theme";
const DEFAULT: FontThemePref = "sans";
const listeners = new Set<() => void>();

/** Turn a saved value into a font theme that exists. An unknown or empty value gets the default. */
export function normalizeFontTheme(v: string | null | undefined): FontThemePref {
  return v === "serif" || v === "sans" || v === "mono" ? v : DEFAULT;
}

export function getFontThemePref(): FontThemePref {
  if (typeof window === "undefined") return DEFAULT;
  return normalizeFontTheme(localStorage.getItem(KEY));
}

export function applyFontTheme(pref: FontThemePref) {
  if (typeof window !== "undefined") {
    document.documentElement.setAttribute("data-font-theme", pref);
  }
}

export function setFontThemePref(pref: FontThemePref) {
  localStorage.setItem(KEY, pref);
  applyFontTheme(pref);
  listeners.forEach((fn) => fn());
}

export function subscribeFontTheme(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
