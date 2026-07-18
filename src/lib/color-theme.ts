"use client";

export type ColorThemePref = "paper" | "nord" | "forest" | "royal";

const KEY = "wp-color-theme";
const listeners = new Set<() => void>();

export function getColorThemePref(): ColorThemePref {
  if (typeof window === "undefined") return "paper";
  const v = localStorage.getItem(KEY);
  return v === "nord" || v === "forest" || v === "royal" ? v : "paper";
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
