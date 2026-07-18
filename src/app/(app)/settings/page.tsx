"use client";

import { useState, useSyncExternalStore, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { authClient } from "@/lib/auth-client";
import { getThemePref, setThemePref, subscribeTheme, type ThemePref } from "@/lib/theme";
import { getColorThemePref, setColorThemePref, subscribeColorTheme, type ColorThemePref } from "@/lib/color-theme";
import { getFontThemePref, setFontThemePref, subscribeFontTheme, type FontThemePref } from "@/lib/font-theme";
import { DeferredSpinner } from "@/components/deferred-spinner";

type ApiKeyRow = {
  id: string;
  name: string | null;
  start: string | null;
  createdAt: string | Date;
  lastRequest: string | Date | null;
  metadata?: unknown;
};

function scopesOf(metadata: unknown): string {
  try {
    const obj = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    const scopes = (obj as { scopes?: unknown })?.scopes;
    if (Array.isArray(scopes)) return scopes.join(",");
  } catch {
    // fall through
  }
  return "read";
}

/* Swatch data straight from the design's themeOptions. */
const THEME_CARDS: {
  key: ThemePref;
  label: string;
  glyph: string;
  desc: string;
  swBg: string;
  swInk: string;
  swAccent: string;
  swMuted: string;
}[] = [
  { key: "light", label: "Light", glyph: "☀", desc: "Warm paper, always.", swBg: "#f5efe3", swInk: "#241d10", swAccent: "#b4501e", swMuted: "#c8bb9a" },
  { key: "dark", label: "Dark", glyph: "☾", desc: "Lamplight, always.", swBg: "#151109", swInk: "#ede4cd", swAccent: "#e08a4e", swMuted: "#4d442a" },
  { key: "system", label: "System", glyph: "◐", desc: "Follows your OS setting.", swBg: "linear-gradient(105deg,#f5efe3 50%,#151109 50%)", swInk: "linear-gradient(105deg,#241d10 60%,#ede4cd 60%)", swAccent: "#b4501e", swMuted: "linear-gradient(105deg,#c8bb9a 70%,#4d442a 70%)" },
];

function AppearanceSection() {
  const pref = useSyncExternalStore(subscribeTheme, getThemePref, () => "system" as const);
  return (
    <section className="rounded-xl border border-edge bg-surface p-5 shadow-card">
      <h2 className="mb-1 text-sm font-semibold">Appearance</h2>
      <p className="mb-3.5 text-xs text-ink-muted">Theme applies instantly and is remembered on this device.</p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3" suppressHydrationWarning>
        {THEME_CARDS.map((t) => {
          const on = pref === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setThemePref(t.key)}
              className={`flex flex-col gap-2 rounded-[10px] border-[1.5px] bg-surface-2 p-2.5 text-left ${
                on ? "border-accent" : "border-edge hover:border-edge-strong"
              }`}
            >
              <span
                className="relative block h-11 overflow-hidden rounded-md border border-edge"
                style={{ background: t.swBg }}
              >
                <span className="absolute left-2 top-2 h-[5px] w-11 rounded" style={{ background: t.swInk }} />
                <span className="absolute left-2 top-[18px] h-[5px] w-7 rounded" style={{ background: t.swAccent }} />
                <span className="absolute left-2 top-7 h-[5px] w-14 rounded" style={{ background: t.swMuted }} />
              </span>
              <span className={`flex items-center gap-1.5 text-[12.5px] font-semibold ${on ? "text-accent" : "text-ink"}`}>
                {t.glyph} {t.label}
              </span>
              <span className="text-[11px] text-ink-faint">{t.desc}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const COLOR_THEME_CARDS: {
  key: ColorThemePref;
  label: string;
  desc: string;
  swBg: string;
  swInk: string;
  swAccent: string;
  swMuted: string;
}[] = [
  { key: "paper", label: "Paper", desc: "Warm sepia, amber accent.", swBg: "#f5efe3", swInk: "#241d10", swAccent: "#b4501e", swMuted: "#c8bb9a" },
  { key: "nord", label: "Nordic", desc: "Cool grey, blue/teal accent.", swBg: "#eef2f7", swInk: "#0f172a", swAccent: "#0284c7", swMuted: "#94a3b8" },
  { key: "forest", label: "Forest", desc: "Earthy sage, pine accent.", swBg: "#edf1eb", swInk: "#1c281a", swAccent: "#2d6a4f", swMuted: "#a3b89f" },
  { key: "royal", label: "Royal", desc: "Rich purple, gold/lavender.", swBg: "#f5f0f6", swInk: "#24112c", swAccent: "#7b2cb1", swMuted: "#b796c3" },
];

function ColorPaletteSection() {
  const pref = useSyncExternalStore(subscribeColorTheme, getColorThemePref, () => "paper" as const);
  const qc = useQueryClient();

  const themeMut = useMutation({
    mutationFn: (theme: ColorThemePref) => api.updateMe({ colorTheme: theme }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  return (
    <section className="rounded-xl border border-edge bg-surface p-5 shadow-card">
      <h2 className="mb-1 text-sm font-semibold">Color Palette</h2>
      <p className="mb-3.5 text-xs text-ink-muted">Choose a theme variant. Applies to both light and dark modes.</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" suppressHydrationWarning>
        {COLOR_THEME_CARDS.map((t) => {
          const on = pref === t.key;
          return (
            <button
              key={t.key}
              disabled={themeMut.isPending}
              onClick={() => {
                setColorThemePref(t.key);
                themeMut.mutate(t.key);
              }}
              className={`flex flex-col gap-2 rounded-[10px] border-[1.5px] bg-surface-2 p-2.5 text-left transition-all ${
                on ? "border-accent" : "border-edge hover:border-edge-strong"
              } ${themeMut.isPending ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              <span
                className="relative block h-11 overflow-hidden rounded-md border border-edge"
                style={{ background: t.swBg }}
              >
                <span className="absolute left-2 top-2 h-[5px] w-11 rounded" style={{ background: t.swInk }} />
                <span className="absolute left-2 top-[18px] h-[5px] w-7 rounded" style={{ background: t.swAccent }} />
                <span className="absolute left-2 top-7 h-[5px] w-14 rounded" style={{ background: t.swMuted }} />
              </span>
              <span className={`text-[12.5px] font-semibold ${on ? "text-accent" : "text-ink"} flex items-center gap-1.5`}>
                {t.label}
                <DeferredSpinner isPending={themeMut.isPending && themeMut.variables === t.key} className="h-3 w-3" />
              </span>
              <span className="text-[11px] text-ink-faint leading-tight">{t.desc}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const FONT_THEME_CARDS: {
  key: FontThemePref;
  label: string;
  fontFamilyClass: string;
  desc: string;
}[] = [
  { key: "serif", label: "Serif", fontFamilyClass: "font-serif", desc: "Warm literary style." },
  { key: "sans", label: "Sans-Serif", fontFamilyClass: "font-sans", desc: "Clean & contemporary." },
  { key: "mono", label: "Monospace", fontFamilyClass: "font-mono", desc: "Bold developer feel." },
];

function FontStyleSection() {
  const pref = useSyncExternalStore(subscribeFontTheme, getFontThemePref, () => "serif" as const);
  const qc = useQueryClient();

  const fontMut = useMutation({
    mutationFn: (font: FontThemePref) => api.updateMe({ fontTheme: font }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const getFamilyStyle = (key: FontThemePref) => {
    if (key === "serif") return { fontFamily: "var(--font-newsreader), Georgia, serif" };
    if (key === "sans") return { fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" };
    if (key === "mono") return { fontFamily: "var(--font-plex-mono), ui-monospace, monospace" };
    return {};
  };

  return (
    <section className="rounded-xl border border-edge bg-surface p-5 shadow-card">
      <h2 className="mb-1 text-sm font-semibold">Font Style</h2>
      <p className="mb-3.5 text-xs text-ink-muted">Choose your preferred typography category for headings and UI accents.</p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3" suppressHydrationWarning>
        {FONT_THEME_CARDS.map((t) => {
          const on = pref === t.key;
          return (
            <button
              key={t.key}
              disabled={fontMut.isPending}
              onClick={() => {
                setFontThemePref(t.key);
                fontMut.mutate(t.key);
              }}
              className={`flex flex-col gap-2 rounded-[10px] border-[1.5px] bg-surface-2 p-2.5 text-left transition-all ${
                on ? "border-accent" : "border-edge hover:border-edge-strong"
              } ${fontMut.isPending ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              <span
                className="relative flex h-11 items-center justify-center rounded-md border border-edge bg-surface"
                style={getFamilyStyle(t.key)}
              >
                <span className="text-2xl font-medium text-ink">Aa</span>
              </span>
              <span
                className={`text-[12.5px] font-semibold ${on ? "text-accent" : "text-ink"} flex items-center gap-1.5`}
                style={getFamilyStyle(t.key)}
              >
                {t.label}
                <DeferredSpinner isPending={fontMut.isPending && fontMut.variables === t.key} className="h-3 w-3" />
              </span>
              <span className="text-[11px] text-ink-faint leading-tight">{t.desc}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: api.me });
  if (!me) {
    return (
      <main className="flex-1 py-16 text-center font-serif text-base italic text-ink-faint">Loading…</main>
    );
  }
  return <SettingsForm key={me.userId} me={me} />;
}

function SettingsForm({
  me,
}: {
  me: { userId: string; timezone: string; jiraBaseUrl: string | null; githubBaseUrl: string | null; colorTheme: string; fontTheme: string };
}) {
  const qc = useQueryClient();
  const [timezone, setTimezone] = useState(me.timezone);
  const [jira, setJira] = useState(me.jiraBaseUrl ?? "");
  const [github, setGithub] = useState(me.githubBaseUrl ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me.colorTheme) {
      const currentLocal = getColorThemePref();
      if (currentLocal !== me.colorTheme) {
        setColorThemePref(me.colorTheme as ColorThemePref);
      }
    }
  }, [me.colorTheme]);

  useEffect(() => {
    if (me.fontTheme) {
      const currentLocal = getFontThemePref();
      if (currentLocal !== me.fontTheme) {
        setFontThemePref(me.fontTheme as FontThemePref);
      }
    }
  }, [me.fontTheme]);

  const saveMut = useMutation({
    mutationFn: () =>
      api.updateMe({
        timezone,
        jiraBaseUrl: jira.trim() || null,
        githubBaseUrl: github.trim() || null,
      }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      qc.invalidateQueries();
    },
  });

  // ----- PATs -----
  const { data: keys, refetch: refetchKeys } = useQuery({
    queryKey: ["apikeys"],
    queryFn: async () => {
      const { data, error } = await authClient.apiKey.list();
      if (error) throw new Error(error.message);
      return (data?.apiKeys ?? []) as ApiKeyRow[];
    },
  });
  const [tokenName, setTokenName] = useState("");
  const [tokenScope, setTokenScope] = useState<"read" | "read,write">("read,write");
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [creatingToken, setCreatingToken] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);

  async function createToken(e: React.FormEvent) {
    e.preventDefault();
    setTokenError(null);
    setCreatingToken(true);
    try {
      const { data, error } = await authClient.apiKey.create({
        name: tokenName.trim() || "token",
        metadata: { scopes: tokenScope.split(",") },
      });
      if (error) {
        setTokenError(error.message ?? "Failed to create token");
        return;
      }
      setFreshToken((data as { key: string }).key);
      setTokenName("");
      refetchKeys();
    } finally {
      setCreatingToken(false);
    }
  }

  const timezones = [
    ...(typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : ["Asia/Kolkata", "UTC"]),
  ];
  // Browsers may list a different canonical alias (e.g. Asia/Calcutta) than the
  // stored IANA id; keep the stored value selectable or the select silently
  // falls back to the first option and a save would overwrite the setting.
  if (timezone && !timezones.includes(timezone)) timezones.unshift(timezone);

  const inputCls =
    "w-full rounded-[7px] border border-edge bg-surface-2 px-2.5 py-2 outline-none focus:border-accent";

  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-4 px-7 pb-16 pt-[26px]">
      <h1 className="font-serif text-[32px] font-medium tracking-tight">Settings</h1>

      <AppearanceSection />
      <ColorPaletteSection />
      <FontStyleSection />

      {/* Timezone & link templates */}
      <section className="rounded-xl border border-edge bg-surface p-5 shadow-card">
        <h2 className="mb-3.5 text-sm font-semibold">Timezone &amp; link templates</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMut.mutate();
          }}
          className="flex flex-col gap-3.5 text-[13px]"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs text-ink-muted">
              Timezone (day/week/month bucketing happens here)
            </span>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls}>
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-ink-muted">
              Jira base URL — makes every Jira ref a one-click link
            </span>
            <input
              type="url"
              value={jira}
              onChange={(e) => setJira(e.target.value)}
              placeholder="https://yourorg.atlassian.net"
              className={`${inputCls} font-mono text-xs`}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-ink-muted">
              GitHub org URL — makes PR refs like <span className="font-mono">repo#123</span> clickable
            </span>
            <input
              type="url"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/yourorg"
              className={`${inputCls} font-mono text-xs`}
            />
          </label>
           <div>
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="rounded-[7px] bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-accent-ink hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
            >
              <DeferredSpinner isPending={saveMut.isPending} className="h-3.5 w-3.5 text-current" />
              {saved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </form>
      </section>

      {/* PATs */}
      <section className="rounded-xl border border-edge bg-surface p-5 shadow-card">
        <h2 className="mb-1 text-sm font-semibold">Personal access tokens</h2>
        <p className="mb-3.5 text-xs text-ink-muted">
          For AI agents and scripts. Shown once, hashed at rest, revocable. Point your agent at{" "}
          <a href="/llms.txt" target="_blank" className="font-mono">
            /llms.txt
          </a>{" "}
          for usage instructions.
        </p>

        {freshToken && (
          <div className="mb-3.5 rounded-[9px] border border-warn bg-[var(--accent-soft)] px-[13px] py-[11px] text-xs">
            <p className="mb-[7px] font-semibold text-warn">
              Copy this token now — it won&apos;t be shown again:
            </p>
            <code className="block select-all break-all rounded-md bg-surface-2 p-[9px] font-mono text-[11.5px]">
              {freshToken}
            </code>
            <button
              onClick={() => setFreshToken(null)}
              className="mt-[7px] text-[11.5px] text-ink-muted underline"
            >
              Done, hide it
            </button>
          </div>
        )}

        <form onSubmit={createToken} className="mb-3.5 flex flex-wrap gap-2">
          <input
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="Token name (e.g. claude-code)"
            className="w-[190px] rounded-[7px] border border-edge bg-surface-2 px-2.5 py-[7px] text-xs outline-none focus:border-accent"
          />
          <select
            value={tokenScope}
            onChange={(e) => setTokenScope(e.target.value as "read" | "read,write")}
            className="rounded-[7px] border border-edge bg-surface-2 px-2 py-[7px] text-xs"
          >
            <option value="read,write">read + write</option>
            <option value="read">read only</option>
          </select>
          <button
            type="submit"
            disabled={creatingToken}
            className="rounded-[7px] border border-edge px-3.5 py-[7px] text-xs text-ink-muted hover:border-edge-strong disabled:opacity-50 flex items-center gap-1.5"
          >
            <DeferredSpinner isPending={creatingToken} className="h-3 w-3 text-current" />
            Create token
          </button>
          {tokenError && <span className="text-xs text-danger">{tokenError}</span>}
        </form>

        <ul className="text-xs">
          {(keys ?? []).map((k) => (
            <li key={k.id} className="flex items-center gap-3 border-t border-edge py-[9px]">
              <span className="font-semibold">{k.name ?? "unnamed"}</span>
              <span className="font-mono text-ink-faint">{k.start}…</span>
              <span className="text-ink-faint">
                {k.lastRequest ? `last used ${new Date(k.lastRequest).toLocaleDateString()}` : "never used"}
              </span>
              <span className="rounded border border-edge px-1.5 py-px font-mono text-[10px] text-ink-muted">
                {scopesOf(k.metadata)}
              </span>
              <button
                disabled={revokingKeyId !== null}
                onClick={async () => {
                  if (window.confirm(`Revoke token "${k.name ?? k.id}"?`)) {
                    setRevokingKeyId(k.id);
                    try {
                      await authClient.apiKey.delete({ keyId: k.id });
                      refetchKeys();
                    } finally {
                      setRevokingKeyId(null);
                    }
                  }
                }}
                className="ml-auto rounded-md border border-edge px-2.5 py-[3px] text-[11px] text-ink-faint hover:border-danger hover:text-danger disabled:opacity-50 flex items-center gap-1.5"
              >
                <DeferredSpinner isPending={revokingKeyId === k.id} className="h-3 w-3 text-current" />
                Revoke
              </button>
            </li>
          ))}
          {(keys ?? []).length === 0 && (
            <li className="border-t border-edge py-[9px] font-serif italic text-ink-faint">No tokens yet.</li>
          )}
        </ul>
      </section>

      {/* Data rights */}
      <section className="rounded-xl border border-edge bg-surface p-5 shadow-card">
        <h2 className="mb-1 text-sm font-semibold">Your data</h2>
        <p className="mb-3.5 text-xs text-ink-muted">
          Export everything as JSON, or permanently delete the account and all its data. See{" "}
          <a href="/privacy">privacy</a>.
        </p>
        <div className="flex gap-2.5">
          <a
            href="/api/v1/export"
            download
            className="rounded-[7px] border border-edge px-4 py-2 text-xs !text-ink-muted no-underline hover:border-edge-strong"
          >
            Export JSON
          </a>
          <button
            onClick={async () => {
              const typed = window.prompt(
                'This permanently deletes your account, all rows, timesheets, and tokens. Type "DELETE" to confirm.',
              );
              if (typed === "DELETE") {
                await api.deleteAccount();
                window.location.href = "/signup";
              }
            }}
            className="rounded-[7px] border border-danger px-4 py-2 text-xs text-danger hover:bg-[var(--accent-soft)]"
          >
            Delete account…
          </button>
        </div>
      </section>
    </main>
  );
}
