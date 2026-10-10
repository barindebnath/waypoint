"use client";

import { useState, useSyncExternalStore } from "react";
import { SparklesIcon } from "./icons";
import { BoardCard, StaticPreviewProvider } from "@/components/board-card";
import { Chip } from "@/components/chip";
import { BoardIcon, MoonIcon, PlusIcon, SunIcon } from "@/components/icons";
import { btnPrimary } from "@/components/ui";
import { sampleBoardRows, samplePreview } from "./board-fixtures";
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

type ThemePalette = "lime" | "paper" | "nord" | "royal";
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
    key: "lime",
    name: "Charcoal & Lime",
    desc: "Dark panels, lime accent.",
    bgLight: "#f6f6f2",
    surfaceLight: "#ffffff",
    accentLight: "#93d00e",
    inkLight: "#161612",
    edgeLight: "#e3e3db",
    bgDark: "#111111",
    surfaceDark: "#181818",
    accentDark: "#93d00e",
    inkDark: "#f5f5f3",
    edgeDark: "#262626",
  },
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

/** The small facts the preview shows: the layers of the palette, from the desk up to the accent. */
const LAYER_SWATCHES = ["bg-desk", "bg-bg", "bg-surface", "bg-surface-2", "bg-surface-3", "bg-accent"];

export function ThemeShowcase() {
  const activeColorTheme = useSyncExternalStore(
    subscribeColorTheme,
    getColorThemePref,
    () => "lime" as ColorThemePref
  );
  const activeFontTheme = useSyncExternalStore(
    subscribeFontTheme,
    getFontThemePref,
    () => "sans" as FontThemePref
  );

  const [selectedPalette, setSelectedPalette] = useState<ThemePalette>(
    (activeColorTheme as ThemePalette) || "lime"
  );
  const [selectedMode, setSelectedMode] = useState<ThemeMode>("dark");
  const [selectedFont, setSelectedFont] = useState<FontThemePref>(
    activeFontTheme || "sans"
  );
  const [appliedGlobal, setAppliedGlobal] = useState(false);
  // The Development card with an approved PR (OFF-13698).
  const [previewRow] = useState(() => sampleBoardRows()[1]);


  const isDark = selectedMode === "dark";
  const selected = PALETTES.find((p) => p.key === selectedPalette) ?? PALETTES[0];


  const handleApplyGlobal = () => {
    setColorThemePref(selectedPalette);
    setFontThemePref(selectedFont);
    setAppliedGlobal(true);
    setTimeout(() => setAppliedGlobal(false), 2500);
  };

  return (
    <div className="w-full space-y-5 rounded-3xl bg-surface p-4 sm:p-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-serif text-lg font-semibold tracking-tight text-ink">
              Crafted Aesthetics &amp; Personal Themes
            </h3>
            <Chip tone="lime">4 Palettes</Chip>
          </div>
          <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-muted">
            Charcoal panels, round corners and one vivid accent, with complete light &amp; dark mode parity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Light/Dark Toggle */}
          <div role="group" aria-label="Preview mode" className="flex items-center gap-1 rounded-full bg-surface-2 p-1">
            <button
              type="button"
              aria-pressed={selectedMode === "light"}
              onClick={() => setSelectedMode("light")}
              className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${
                selectedMode === "light"
                  ? "bg-surface-3 font-semibold text-ink"
                  : "font-medium text-ink-muted hover:text-ink"
              }`}
            >
              <SunIcon className="h-4 w-4" />
              Light
            </button>
            <button
              type="button"
              aria-pressed={selectedMode === "dark"}
              onClick={() => setSelectedMode("dark")}
              className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${
                selectedMode === "dark"
                  ? "bg-surface-3 font-semibold text-ink"
                  : "font-medium text-ink-muted hover:text-ink"
              }`}
            >
              <MoonIcon className="h-4 w-4" />
              Dark
            </button>
          </div>

          {/* Action button to apply theme to entire site */}
          <button
            type="button"
            onClick={handleApplyGlobal}
            className={btnPrimary}
            title="Applies the selected palette and typography to the live page"
          >
            <SparklesIcon className="h-4 w-4" />
            <span>{appliedGlobal ? "Applied to Page!" : "Apply to Page"}</span>
          </button>
        </div>
      </div>

      {/* Palette Selection Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PALETTES.map((p) => {
          const isSelected = p.key === selectedPalette;
          const pBg = isDark ? p.bgDark : p.bgLight;
          const pSurface = isDark ? p.surfaceDark : p.surfaceLight;
          const pAccent = isDark ? p.accentDark : p.accentLight;
          const pInk = isDark ? p.inkDark : p.inkLight;
          const pEdge = isDark ? p.edgeDark : p.edgeLight;

          return (
            <button
              key={p.key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedPalette(p.key)}
              className={`flex cursor-pointer flex-col gap-3 rounded-2xl p-3 text-left transition-colors ${
                isSelected ? "bg-surface-2 ring-2 ring-accent" : "bg-surface-2/60 ring-1 ring-edge hover:bg-surface-2"
              }`}
            >
              {/* A small picture of the window in this palette: the sidebar, the panel, the text and the accent */}
              <div
                className="flex h-14 items-center gap-1.5 rounded-xl p-1.5"
                style={{ backgroundColor: pBg, boxShadow: `inset 0 0 0 1px ${pEdge}` }}
              >
                <span className="h-full w-4 shrink-0 rounded-lg" style={{ backgroundColor: pSurface }} />
                <span
                  className="flex h-full min-w-0 flex-1 flex-col justify-center gap-1.5 rounded-lg px-2"
                  style={{ backgroundColor: pSurface }}
                >
                  <span className="block h-1.5 w-8 rounded-full" style={{ backgroundColor: pInk, opacity: 0.6 }} />
                  <span className="block h-1.5 w-5 rounded-full" style={{ backgroundColor: pAccent }} />
                </span>
              </div>

              <div>
                <div className="text-[13px] font-semibold text-ink">{p.name}</div>
                <div className="mt-0.5 text-[11.5px] text-ink-muted">{p.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Font Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-t border-edge/60 pt-4">
        <span className="mr-1 text-xs font-medium text-ink-muted">Typography:</span>
        {(["serif", "sans", "mono"] as FontThemePref[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={selectedFont === f}
            onClick={() => setSelectedFont(f)}
            className={`h-8 cursor-pointer rounded-full px-3.5 text-xs transition-colors ${
              selectedFont === f
                ? "bg-accent-soft font-semibold text-accent-fg ring-1 ring-accent/40"
                : "bg-surface-2 font-medium text-ink-muted hover:bg-surface-3 hover:text-ink"
            }`}
          >
            {f === "serif" ? "Newsreader Serif" : f === "sans" ? "Inter Sans" : "IBM Plex Mono"}
          </button>
        ))}
      </div>

      {/*
        Live preview: a small window with a real Board card, inside a wrapper with its own theme attributes.
        It shows the selected palette, mode and font without a change of the page theme.
        The heading uses the heading font, so the typography choice is visible.
      */}
      <div
        data-theme={selectedMode}
        data-color-theme={selectedPalette}
        data-font-theme={selectedFont}
        className="rounded-panel bg-desk p-2.5 text-ink ring-1 ring-edge transition-colors duration-300"
      >
        <div className="rounded-3xl bg-bg p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface text-accent-fg">
              <BoardIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="font-serif text-[24px] font-semibold leading-none tracking-tight">Board</p>
              <p className="mt-1.5 text-[13px] text-ink-muted">{selected.name}</p>
            </div>
            <span className="ml-auto inline-flex h-10 items-center gap-2 rounded-2xl bg-accent px-4 text-[13px] font-semibold text-accent-ink">
              <PlusIcon className="h-4 w-4" />
              New card
            </span>
          </div>

          <div className="mt-4 grid gap-3 rounded-lane bg-lane p-3 sm:grid-cols-2">
            <StaticPreviewProvider resolve={samplePreview}>
              <BoardCard row={previewRow} preview />
            </StaticPreviewProvider>

            <div className="flex flex-col gap-4 rounded-card bg-card p-4 shadow-card ring-1 ring-edge/70">
              <div>
                <p className="font-serif text-lg font-semibold tracking-tight">{selected.name}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{selected.desc}</p>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Layers</p>
                <div className="flex items-center gap-2">
                  {LAYER_SWATCHES.map((swatch) => (
                    <span key={swatch} className={`h-7 w-7 rounded-full ring-1 ring-edge-strong ${swatch}`} />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip tone="accent">Accent</Chip>
                <Chip tone="lilac">Product</Chip>
                <Chip tone="yellow">Support</Chip>
                <Chip tone="mint">Approved</Chip>
              </div>
              <div className="flex gap-1" aria-hidden="true">
                <span className="h-1.5 flex-1 rounded-full bg-accent" />
                <span className="h-1.5 flex-1 rounded-full bg-accent" />
                <span className="h-1.5 flex-1 rounded-full bg-accent" />
                <span className="h-1.5 flex-1 rounded-full bg-ink/10" />
                <span className="h-1.5 flex-1 rounded-full bg-ink/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
