"use client";

export type FontThemePref = "serif" | "sans" | "mono";

const KEY = "wp-font-theme";
const listeners = new Set<() => void>();

export function getFontThemePref(): FontThemePref {
  if (typeof window === "undefined") return "serif";
  const v = localStorage.getItem(KEY);
  return v === "sans" || v === "mono" ? v : "serif";
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
