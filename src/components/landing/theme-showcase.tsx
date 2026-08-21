"use client";

import { useState } from "react";
import { PaletteIcon, SparklesIcon, CheckCircleIcon } from "./icons";

type ThemePalette = "paper" | "nord" | "forest" | "royal";
type ThemeMode = "light" | "dark";
type FontTheme = "serif" | "sans" | "mono";

const PALETTES: {
  key: ThemePalette;
  name: string;
  desc: string;
  bgLight: string;
  surfaceLight: string;
  accentLight: string;
  inkLight: string;
  bgDark: string;
  surfaceDark: string;
  accentDark: string;
  inkDark: string;
}[] = [
  {
    key: "paper",
    name: "Paper & Lamplight",
    desc: "Warm sepia paper and amber accent.",
    bgLight: "#f5efe3",
    surfaceLight: "#fdfaf2",
    accentLight: "#b4501e",
    inkLight: "#241d10",
    bgDark: "#151109",
    surfaceDark: "#1d1811",
    accentDark: "#e08a4e",
    inkDark: "#ede4cd",
  },
  {
    key: "nord",
    name: "Nordic Frost",
    desc: "Cool slate and arctic blue.",
    bgLight: "#eef2f7",
    surfaceLight: "#f8fafc",
    accentLight: "#0284c7",
    inkLight: "#0f172a",
    bgDark: "#0f172a",
    surfaceDark: "#1e293b",
    accentDark: "#38bdf8",
    inkDark: "#f8fafc",
  },
  {
    key: "forest",
    name: "Forest Sage",
    desc: "Earthy pine and deep sage.",
    bgLight: "#edf1eb",
    surfaceLight: "#f7f9f6",
    accentLight: "#2d6a4f",
    inkLight: "#1c281a",
    bgDark: "#101912",
    surfaceDark: "#18231a",
    accentDark: "#52b788",
    inkDark: "#e7ece8",
  },
  {
    key: "royal",
    name: "Royal Plum",
    desc: "Rich amethyst and royal gold.",
    bgLight: "#f5f0f6",
    surfaceLight: "#faf8fc",
    accentLight: "#7b2cb1",
    inkLight: "#24112c",
    bgDark: "#150d1b",
    surfaceDark: "#1f1428",
    accentDark: "#d896ff",
    inkDark: "#ebdff0",
  },
];

export function ThemeShowcase() {
  const [selectedPalette, setSelectedPalette] = useState<ThemePalette>("paper");
  const [selectedMode, setSelectedMode] = useState<ThemeMode>("light");
  const [selectedFont, setSelectedFont] = useState<FontTheme>("serif");

  const palette = PALETTES.find((p) => p.key === selectedPalette)!;

  const isDark = selectedMode === "dark";
  const bg = isDark ? palette.bgDark : palette.bgLight;
  const surface = isDark ? palette.surfaceDark : palette.surfaceLight;
  const accent = isDark ? palette.accentDark : palette.accentLight;
  const ink = isDark ? palette.inkDark : palette.inkLight;

  const fontClass =
    selectedFont === "serif"
      ? "font-serif"
      : selectedFont === "mono"
      ? "font-mono"
      : "font-sans";

  return (
    <div className="w-full rounded-2xl border border-edge bg-surface p-5 sm:p-7 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-edge pb-4">
        <div>
          <div className="flex items-center gap-2">
            <PaletteIcon className="h-4 w-4 text-accent" />
            <h3 className="font-serif text-base font-semibold text-ink">
              Crafted Aesthetics & Personal Themes
            </h3>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Designed like fine editorial stationery. 4 handcrafted palettes with full light & dark mode parity.
          </p>
        </div>

        {/* Mode Switcher */}
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

      {/* Palette Selector */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  ? "border-accent bg-surface-2 ring-1 ring-accent shadow-xs"
                  : "border-edge bg-surface-2/60 hover:border-edge-strong hover:bg-surface-2"
              }`}
            >
              {/* Swatch Mini Preview */}
              <div
                className="h-10 w-full rounded-md border border-edge flex items-center justify-between px-2"
                style={{ backgroundColor: pBg }}
              >
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: pAccent }} />
                <span className="h-2 w-8 rounded" style={{ backgroundColor: pInk, opacity: 0.7 }} />
              </div>

              <div>
                <div className="text-xs font-semibold text-ink">{p.name}</div>
                <div className="text-[11px] text-ink-muted leading-tight mt-0.5">{p.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Font Family Selector */}
      <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-edge">
        <span className="text-xs text-ink-muted">Typography:</span>
        {(["serif", "sans", "mono"] as FontTheme[]).map((f) => (
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

      {/* Live Interactive Preview Card */}
      <div
        className={`mt-5 rounded-xl border p-5 transition-colors duration-300 ${fontClass}`}
        style={{
          backgroundColor: surface,
          borderColor: isDark ? "#3f3a2d" : "#ded3be",
          color: ink,
        }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: isDark ? "#3f3a2d" : "#e6dec9" }}>
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold border"
              style={{ borderColor: accent, color: accent }}
            >
              ZT-4821
            </span>
            <span className="text-xs opacity-75">Sample Status Row</span>
          </div>

          <span className="text-xs font-semibold" style={{ color: accent }}>
            Staging Phase
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium">Triage</span>
          <span className="text-sm font-medium">Development</span>
          <span className="text-sm font-bold" style={{ color: accent }}>Staging ●</span>
          <span className="text-sm opacity-50">QA</span>
          <span className="text-sm opacity-50">Production</span>
        </div>

        <p className="mt-3 text-xs opacity-80 leading-relaxed italic">
          "External memory for a developer who ships. References only, never card contents."
        </p>
      </div>
    </div>
  );
}
