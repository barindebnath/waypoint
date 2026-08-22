"use client";

import { useState, useSyncExternalStore } from "react";
import { SparklesIcon } from "./icons";
import {
  getColorThemePref,
  setColorThemePref,
  subscribeColorTheme,
  type ColorThemePref,
} from "@/lib/color-theme";
import {
  getFontThemePref,
  setFontThemePref,
  subscribeFontTheme,
  type FontThemePref,
} from "@/lib/font-theme";

type ThemePalette = "paper" | "nord" | "forest" | "royal";
type ThemeMode = "light" | "dark";

const PALETTES: {
  key: ThemePalette;
  name: string;
  desc: string;
  bgLight: string;
  surfaceLight: string;
  accentLight: string;
  inkLight: string;
  edgeLight: string;
  bgDark: string;
  surfaceDark: string;
  accentDark: string;
  inkDark: string;
  edgeDark: string;
}[] = [
  {
    key: "paper",
    name: "Paper & Lamplight",
    desc: "Warm sepia & amber.",
    bgLight: "#f5efe3",
    surfaceLight: "#fdfaf2",
    accentLight: "#b4501e",
    inkLight: "#241d10",
    edgeLight: "#e2d9c2",
    bgDark: "#151109",
    surfaceDark: "#1d1811",
    accentDark: "#e08a4e",
    inkDark: "#ede4cd",
    edgeDark: "#2f2818",
  },
  {
    key: "nord",
    name: "Nordic Frost",
    desc: "Cool slate & arctic blue.",
    bgLight: "#eef2f7",
    surfaceLight: "#f8fafc",
    accentLight: "#0284c7",
    inkLight: "#0f172a",
    edgeLight: "#cbd5e1",
    bgDark: "#0f172a",
    surfaceDark: "#1e293b",
    accentDark: "#38bdf8",
    inkDark: "#f8fafc",
    edgeDark: "#334155",
  },
  {
    key: "forest",
    name: "Forest Sage",
    desc: "Earthy pine & sage.",
    bgLight: "#edf1eb",
    surfaceLight: "#f7f9f6",
    accentLight: "#2d6a4f",
    inkLight: "#1c281a",
    edgeLight: "#cbd7c7",
    bgDark: "#101912",
    surfaceDark: "#18231a",
    accentDark: "#52b788",
    inkDark: "#e7ece8",
    edgeDark: "#243927",
  },
  {
    key: "royal",
    name: "Royal Plum",
    desc: "Rich amethyst & gold.",
    bgLight: "#f5f0f6",
    surfaceLight: "#faf8fc",
    accentLight: "#7b2cb1",
    inkLight: "#24112c",
    edgeLight: "#dcc7e2",
    bgDark: "#150d1b",
    surfaceDark: "#1f1428",
    accentDark: "#d896ff",
    inkDark: "#ebdff0",
    edgeDark: "#352443",
  },
];

export function ThemeShowcase() {
  const activeColorTheme = useSyncExternalStore(
    subscribeColorTheme,
    getColorThemePref,
    () => "paper" as ColorThemePref
  );
  const activeFontTheme = useSyncExternalStore(
    subscribeFontTheme,
    getFontThemePref,
    () => "serif" as FontThemePref
  );

  const [selectedPalette, setSelectedPalette] = useState<ThemePalette>(
    (activeColorTheme as ThemePalette) || "paper"
  );
  const [selectedMode, setSelectedMode] = useState<ThemeMode>("light");
  const [selectedFont, setSelectedFont] = useState<FontThemePref>(
    activeFontTheme || "serif"
  );
  const [appliedGlobal, setAppliedGlobal] = useState(false);

  const palette = PALETTES.find((p) => p.key === selectedPalette)!;

  const isDark = selectedMode === "dark";
  const surface = isDark ? palette.surfaceDark : palette.surfaceLight;
  const accent = isDark ? palette.accentDark : palette.accentLight;
  const ink = isDark ? palette.inkDark : palette.inkLight;
  const edge = isDark ? palette.edgeDark : palette.edgeLight;

  const fontClass =
    selectedFont === "serif"
      ? "font-serif"
      : selectedFont === "mono"
      ? "font-mono"
      : "font-sans";

  const handleApplyGlobal = () => {
    setColorThemePref(selectedPalette);
    setFontThemePref(selectedFont);
    setAppliedGlobal(true);
    setTimeout(() => setAppliedGlobal(false), 2500);
  };

  return (
    <div className="w-full rounded-2xl border border-edge bg-surface p-5 sm:p-7 shadow-card space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-edge pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-semibold text-ink">
              Crafted Aesthetics & Personal Themes
            </h3>
            <span className="rounded-full bg-accent-soft text-accent px-2 py-0.5 font-mono text-[10.5px] font-semibold">
              4 Palettes
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Designed like fine editorial stationery with complete light & dark mode parity.
          </p>
        </div>

        {/* Action button to apply theme to entire site */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleApplyGlobal}
            className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/20 transition cursor-pointer"
            title="Applies the selected palette and typography to the live page"
          >
            <SparklesIcon className="h-3 w-3" />
            <span>{appliedGlobal ? "Applied to Page!" : "Apply to Page"}</span>
          </button>

          {/* Light/Dark Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-edge bg-surface-2 p-1">
            <button
              onClick={() => setSelectedMode("light")}
              className={`rounded px-2.5 py-1 text-xs transition cursor-pointer ${
                selectedMode === "light"
                  ? "bg-surface font-semibold text-ink shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              ☀ Light
            </button>
            <button
              onClick={() => setSelectedMode("dark")}
              className={`rounded px-2.5 py-1 text-xs transition cursor-pointer ${
                selectedMode === "dark"
                  ? "bg-surface font-semibold text-ink shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              ☾ Dark
            </button>
          </div>
        </div>
      </div>

      {/* Palette Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PALETTES.map((p) => {
          const isSelected = p.key === selectedPalette;
          const pBg = isDark ? p.bgDark : p.bgLight;
          const pAccent = isDark ? p.accentDark : p.accentLight;
          const pInk = isDark ? p.inkDark : p.inkLight;

          return (
            <button
              key={p.key}
              onClick={() => setSelectedPalette(p.key)}
              className={`flex flex-col gap-2 rounded-xl border p-3 text-left transition cursor-pointer ${
                isSelected
                  ? "border-accent bg-surface-2 ring-1 ring-accent/30 shadow-xs"
                  : "border-edge bg-surface-2/50 hover:border-edge-strong hover:bg-surface-2"
              }`}
            >
              <div
                className="h-10 w-full rounded-md border border-edge flex items-center justify-between px-2.5 shadow-2xs"
                style={{ backgroundColor: pBg }}
              >
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: pAccent }} />
                <div className="space-y-1">
                  <span className="block h-1.5 w-7 rounded-xs" style={{ backgroundColor: pInk, opacity: 0.6 }} />
                  <span className="block h-1.5 w-4 rounded-xs" style={{ backgroundColor: pAccent, opacity: 0.8 }} />
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-ink">{p.name}</div>
                <div className="text-[11px] text-ink-muted mt-0.5">{p.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Font Switcher */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-edge">
        <span className="text-xs text-ink-muted">Typography:</span>
        {(["serif", "sans", "mono"] as FontThemePref[]).map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFont(f)}
            className={`rounded-md border px-2.5 py-1 text-xs capitalize transition cursor-pointer ${
              selectedFont === f
                ? "border-accent bg-accent-soft font-semibold text-accent"
                : "border-edge bg-surface-2 text-ink-muted hover:text-ink"
            }`}
          >
            {f === "serif" ? "Newsreader Serif" : f === "sans" ? "System Sans" : "IBM Plex Mono"}
          </button>
        ))}
      </div>

      {/* Live Preview Card */}
      <div
        className={`rounded-xl border p-5 shadow-sm transition-all duration-300 ${fontClass}`}
        style={{
          backgroundColor: surface,
          borderColor: edge,
          color: ink,
        }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: edge }}>
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold border"
              style={{ borderColor: accent, color: accent }}
            >
              ZT-4821
            </span>
            <span className="text-xs opacity-75 font-mono">PES-1032</span>
          </div>

          <span className="text-xs font-semibold" style={{ color: accent }}>
            Staging Milestone Active
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs sm:text-sm font-medium">
          <span>Triage ✓</span>
          <span>Development ✓</span>
          <span className="font-bold" style={{ color: accent }}>Staging ●</span>
          <span className="opacity-40">QA</span>
          <span className="opacity-40">Production</span>
        </div>

        <p className="mt-3 text-xs opacity-80 italic leading-relaxed">
          &quot;External memory for a developer who ships. References only, never card contents.&quot;
        </p>
      </div>
    </div>
  );
}
