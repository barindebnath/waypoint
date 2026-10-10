"use client";

export type ColorThemePref = "lime" | "paper" | "nord" | "royal";

const KEY = "wp-color-theme";
const DEFAULT: ColorThemePref = "lime";
const listeners = new Set<() => void>();

/**
 * Turn a saved value into a palette that exists.
 * "forest" was the default palette before the lime redesign, so it maps to "lime".
 * An unknown or empty value gets the default.
 */
export function normalizeColorTheme(v: string | null | undefined): ColorThemePref {
  return v === "lime" || v === "paper" || v === "nord" || v === "royal" ? v : DEFAULT;
}

export function getColorThemePref(): ColorThemePref {
  if (typeof window === "undefined") return DEFAULT;
  return normalizeColorTheme(localStorage.getItem(KEY));
}

export function applyColorTheme(pref: ColorThemePref) {
  if (typeof window !== "undefined") {
    document.documentElement.setAttribute("data-color-theme", pref);
  }
}

export function setColorThemePref(pref: ColorThemePref) {
  localStorage.setItem(KEY, pref);
  applyColorTheme(pref);
  listeners.forEach((fn) => fn());
}

export function subscribeColorTheme(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
