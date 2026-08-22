"use client";

import { useState, useSyncExternalStore, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { authClient } from "@/lib/auth-client";
import { OFFICIAL_ACCOUNTS, OFFICIAL_INVESTMENT_CATEGORIES, SYSTEM_COMMON_RULES } from "@/lib/timesheet-shared";
import { getThemePref, setThemePref, subscribeTheme, type ThemePref } from "@/lib/theme";
import { getColorThemePref, setColorThemePref, subscribeColorTheme, type ColorThemePref } from "@/lib/color-theme";
import { getFontThemePref, setFontThemePref, subscribeFontTheme, type FontThemePref } from "@/lib/font-theme";
import { DeferredSpinner } from "@/components/deferred-spinner";
import { RefreshIcon } from "@/components/status-badge";

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
  me: {
    userId: string;
    timezone: string;
    jiraBaseUrl: string | null;
    jiraEmail: string | null;
    jiraApiToken: string | null;
    githubBaseUrl: string | null;
    githubPat: string | null;
    githubDefaultOrg: string | null;
    colorTheme: string;
    fontTheme: string;
    showTimesheet: boolean;
    tempoApiToken: string | null;
    jiraAccountId: string | null;
    msClientId: string | null;
    msClientSecret: string | null;
    msRefreshToken: string | null;
    autoTempoDefaultRule: unknown;
    autoTempoSkipDays: unknown;
    autoTempoRules: unknown;
  };
}) {
  const qc = useQueryClient();
  const [timezone, setTimezone] = useState(me.timezone);
  const [jira, setJira] = useState(me.jiraBaseUrl ?? "");
  const [jiraEmail, setJiraEmail] = useState(me.jiraEmail ?? "");
  const [jiraApiToken, setJiraApiToken] = useState(me.jiraApiToken ?? "");
  const [github, setGithub] = useState(me.githubBaseUrl ?? "");
  const [githubPat, setGithubPat] = useState(me.githubPat ?? "");
  const [githubDefaultOrg] = useState(me.githubDefaultOrg ?? "");

  // AutoTempo states
  const [tempoApiToken, setTempoApiToken] = useState(me.tempoApiToken ?? "");
  const [jiraAccountId, setJiraAccountId] = useState(me.jiraAccountId ?? "");
  const [msClientId, setMsClientId] = useState(me.msClientId ?? "");
  const [msClientSecret, setMsClientSecret] = useState(me.msClientSecret ?? "");
  const [msRefreshToken, setMsRefreshToken] = useState(me.msRefreshToken ?? "");

  const [rulesList, setRulesList] = useState<
    Array<{ id: string; issue: string; account: string; ruleStr: string; type: string; skip: boolean }>
  >(() => {
    if (Array.isArray(me.autoTempoRules) && me.autoTempoRules.length > 0) {
      return me.autoTempoRules.map((r: unknown, idx: number) => {
        const item = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
        return {
          id: `rule-${idx}-${Date.now()}`,
          issue: String(item.issue || ""),
          account: String(item.account || ""),
          ruleStr: Array.isArray(item.rule) ? item.rule.join(", ") : String(item.rule || ""),
          type: String(item.type || "Feature Enhancement"),
          skip: Boolean(item.skip),
        };
      });
    }
    return [];
  });

  const [skipDays, setSkipDays] = useState<string[]>(() => {
    if (Array.isArray(me.autoTempoSkipDays)) return me.autoTempoSkipDays as string[];
    return ["Saturday", "Sunday"];
  });

  const [ruleSearch, setRuleSearch] = useState("");
  const [showSystemRules, setShowSystemRules] = useState(false);

  const [saved, setSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

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
    mutationFn: () => {
      const formattedRules = rulesList.map((r) => {
        const parts = r.ruleStr.split(",").map((p) => p.trim()).filter(Boolean);
        return {
          issue: r.issue.trim(),
          account: r.account.trim(),
          rule: parts.length === 1 ? parts[0] : parts,
          type: r.type,
          ...(r.skip ? { skip: true } : {}),
        };
      });

      return api.updateMe({
        timezone,
        jiraBaseUrl: jira.trim() || null,
        jiraEmail: jiraEmail.trim() || null,
        jiraApiToken: jiraApiToken.trim() || null,
        githubBaseUrl: github.trim() || null,
        githubPat: githubPat.trim() || null,
        githubDefaultOrg: githubDefaultOrg.trim() || null,
        showTimesheet: true,
        tempoApiToken: tempoApiToken.trim() || null,
        jiraAccountId: jiraAccountId.trim() || null,
        msClientId: msClientId.trim() || null,
        msClientSecret: msClientSecret.trim() || null,
        msRefreshToken: msRefreshToken.trim() || null,
        autoTempoSkipDays: skipDays,
        autoTempoRules: formattedRules,
      });
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      qc.invalidateQueries();
    },
  });

  const [syncMessages, setSyncMessages] = useState<string[]>([]);

  const syncMut = useMutation({
    mutationFn: () => api.syncIntegrations(),
    onSuccess: (res) => {
      setSyncStatus(`Sync complete! Synced ${res.syncedJiraCount} Jira issue(s) & ${res.syncedGithubCount} GitHub PR(s).`);
      setSyncMessages(res.messages ?? []);
      qc.invalidateQueries();
      setTimeout(() => {
        setSyncStatus(null);
        setSyncMessages([]);
      }, 10000);
    },
    onError: (err: Error) => {
      setSyncStatus(`Sync failed: ${err.message}`);
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
        <div className="flex flex-col gap-3.5 text-[13px]">
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
              name="jira_base_url_setting"
              autoComplete="off"
              value={jira}
              onChange={(e) => setJira(e.target.value)}
              placeholder="https://yourorg.atlassian.net"
              className={`${inputCls} font-mono text-xs`}
            />
          </label>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-ink-muted">
                Jira Account Email (for status sync)
              </span>
              <input
                type="text"
                name="jira_email_setting"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={jiraEmail}
                onChange={(e) => setJiraEmail(e.target.value)}
                placeholder="dev@company.com"
                className={`${inputCls} font-mono text-xs`}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-ink-muted">
                Jira API Token
              </span>
              <input
                type="text"
                name="jira_api_token_setting"
                autoComplete="off"
                style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={jiraApiToken}
                onChange={(e) => setJiraApiToken(e.target.value)}
                placeholder="ATATT3xFfGF0..."
                className={`${inputCls} font-mono text-xs`}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-ink-muted">
                GitHub Org / Owner (makes PR refs clickable & resolve short <span className="font-mono">repo#123</span> refs)
              </span>
              <input
                type="text"
                name="github_org_setting"
                autoComplete="off"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="my-org or https://github.com/my-org"
                className={`${inputCls} font-mono text-xs`}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-ink-muted">
                GitHub Personal Access Token (PAT)
              </span>
              <input
                type="text"
                name="github_pat_setting"
                autoComplete="off"
                style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={githubPat}
                onChange={(e) => setGithubPat(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className={`${inputCls} font-mono text-xs`}
              />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="rounded-[7px] bg-accent px-[18px] py-[9px] text-[13px] font-bold text-accent-ink hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <DeferredSpinner isPending={saveMut.isPending} className="h-3.5 w-3.5 text-current" />
              {saved ? "Saved ✓" : "Save"}
            </button>
            <button
              type="button"
              disabled={syncMut.isPending}
              onClick={() => syncMut.mutate()}
              className="rounded-[7px] border border-edge bg-surface-2 px-3.5 py-[9px] text-[13px] font-semibold text-ink hover:border-edge-strong disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <DeferredSpinner isPending={syncMut.isPending} className="h-3.5 w-3.5 text-current" />
              {!syncMut.isPending && <RefreshIcon className="h-3.5 w-3.5 text-ink-muted" />}
              Sync Integrations Now
            </button>
          </div>
          {syncStatus && <p className="text-xs text-accent font-medium mt-1">{syncStatus}</p>}
          {syncMessages.length > 0 && (
            <div className="mt-2 rounded-md border border-warn/40 bg-warn/10 p-2.5 text-xs text-warn flex flex-col gap-1">
              {syncMessages.map((msg, i) => (
                <p key={i}>⚠️ {msg}</p>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AutoTempo Integration & Rules */}
      <section className="rounded-xl border border-edge bg-surface p-5 shadow-card">
        <h2 className="mb-1 text-sm font-semibold">AutoTempo Integration &amp; Rules</h2>
        <p className="mb-3.5 text-xs text-ink-muted">
          Configure Tempo API token, Jira Account ID, Microsoft Outlook Graph credentials, and matching rules to auto-fill worklogs.
        </p>
        <div className="flex flex-col gap-3.5 text-[13px]">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-ink-muted">Tempo API Token</span>
              <input
                type="text"
                value={tempoApiToken}
                onChange={(e) => setTempoApiToken(e.target.value)}
                placeholder="Log into Tempo -> Settings -> API Integration -> New Token"
                style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
                className={`${inputCls} font-mono text-xs`}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-ink-muted">Jira Account ID</span>
              <input
                type="text"
                value={jiraAccountId}
                onChange={(e) => setJiraAccountId(e.target.value)}
                placeholder="Jira Profile -> grab ID at end of URL"
                className={`${inputCls} font-mono text-xs`}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs text-ink-muted">MS Client ID (Optional)</span>
              <input
                type="text"
                value={msClientId}
                onChange={(e) => setMsClientId(e.target.value)}
                placeholder="cb1cf73c-ad9a-..."
                className={`${inputCls} font-mono text-xs`}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-ink-muted">MS Client Secret (Optional)</span>
              <input
                type="text"
                value={msClientSecret}
                onChange={(e) => setMsClientSecret(e.target.value)}
                placeholder="Secret value"
                style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
                className={`${inputCls} font-mono text-xs`}
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="mb-1.5 block text-xs text-ink-muted">MS Refresh Token</span>
              <input
                type="text"
                value={msRefreshToken}
                onChange={(e) => setMsRefreshToken(e.target.value)}
                placeholder="OAuth Refresh Token"
                style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
                className={`${inputCls} font-mono text-xs`}
              />
            </label>
          </div>

          {/* Waypoint Rows Allocation Notice */}
          <div className="rounded-lg border border-edge bg-surface-2/60 p-3.5 flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink">Waypoint Rows Auto-Fill</span>
            <p className="text-[11px] text-ink-muted">
              AutoTempo allocates remaining workday hours directly across your active Waypoint rows (cards you worked on), looking up Jira issue IDs and mapping Tempo finance account categories automatically.
            </p>
          </div>

          {/* Skip Days Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink">Skip Days</span>
            <p className="text-[11px] text-ink-muted">Days to exclude from AutoTempo logging (e.g. weekends or non-working days).</p>
            <div className="flex flex-wrap gap-1.5">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((dayName) => {
                const isSkipped = skipDays.includes(dayName);
                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() =>
                      setSkipDays(
                        isSkipped ? skipDays.filter((d) => d !== dayName) : [...skipDays, dayName]
                      )
                    }
                    className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs font-semibold transition-all ${
                      isSkipped
                        ? "border-accent bg-accent/20 text-accent"
                        : "border-edge bg-surface-2 text-ink-faint hover:border-edge-strong hover:text-ink"
                    }`}
                  >
                    {dayName} {isSkipped ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Company Common Rules Banner & Personal Overrides */}
          <div className="flex flex-col gap-3">
            {/* Company Common Rules Banner */}
            <div className="rounded-lg border border-done/30 bg-done-soft/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-done">✓ Company-Wide Common Rules</span>
                  <span className="rounded-full bg-done-soft px-2 py-0.5 text-[10px] font-bold text-done">
                    {SYSTEM_COMMON_RULES.length} Global Rules Active
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Inherited automatically for all employees (1:1s, Standups, Retros, Leave, Public Holidays, Training, etc.).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSystemRules(!showSystemRules)}
                className="cursor-pointer rounded-md border border-edge bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-all shrink-0"
              >
                {showSystemRules ? "Hide System Rules" : `Inspect System Rules (${SYSTEM_COMMON_RULES.length})`}
              </button>
            </div>

            {/* Read-Only System Rules Viewer */}
            {showSystemRules && (
              <div className="rounded-lg border border-edge bg-surface-2 p-3.5 flex flex-col gap-2.5 animate-fade-in">
                <div className="flex items-center justify-between gap-2 border-b border-edge/60 pb-2">
                  <span className="text-xs font-semibold text-ink">System Common Rules Directory</span>
                  <input
                    type="text"
                    value={ruleSearch}
                    onChange={(e) => setRuleSearch(e.target.value)}
                    placeholder="🔍 Search system rules..."
                    className={`${inputCls} w-44 sm:w-56 text-xs py-1`}
                  />
                </div>

                <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5 pr-1">
                  <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold text-ink-muted px-2 uppercase tracking-wider sticky top-0 bg-surface-2 py-1 z-10">
                    <span className="col-span-5">Keywords / Meeting Title</span>
                    <span className="col-span-2">Issue Key</span>
                    <span className="col-span-3">Account</span>
                    <span className="col-span-2">Category</span>
                  </div>

                  {SYSTEM_COMMON_RULES.filter((r) => {
                    if (!ruleSearch.trim()) return true;
                    const search = ruleSearch.toLowerCase();
                    const ruleText = Array.isArray(r.rule) ? r.rule.join(" ") : r.rule;
                    return (
                      ruleText.toLowerCase().includes(search) ||
                      (r.issue && r.issue.toLowerCase().includes(search)) ||
                      (r.account && r.account.toLowerCase().includes(search))
                    );
                  }).map((r, i) => (
                    <div key={i} className="rounded border border-edge/60 bg-surface p-2 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                      <div className="sm:col-span-5 font-mono text-[11.5px] text-ink">
                        {Array.isArray(r.rule) ? r.rule.join(", ") : r.rule}
                        {r.skip && <span className="ml-2 text-[10px] text-warn font-semibold">(Skipped)</span>}
                      </div>
                      <div className="sm:col-span-2 font-mono text-ink-muted text-[11px]">
                        {r.issue || "—"}
                      </div>
                      <div className="sm:col-span-3 font-mono text-accent text-[11px]">
                        {r.account || "—"}
                      </div>
                      <div className="sm:col-span-2 text-ink-muted text-[11px]">
                        {r.type || (r.skip ? "Ignored" : "General")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Overrides Section */}
            <div className="rounded-lg border border-edge bg-surface-2 p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-ink">Personal Custom Overrides</span>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    Add employee-specific or project-specific meeting keyword rules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRulesList([
                      {
                        id: `rule-${Date.now()}`,
                        issue: "",
                        account: "CAP_DEV_NEW",
                        ruleStr: "",
                        type: "Feature Enhancement",
                        skip: false,
                      },
                      ...rulesList,
                    ])
                  }
                  className="cursor-pointer rounded-md border border-edge bg-surface px-2.5 py-1 text-xs font-semibold text-accent hover:border-accent shrink-0"
                >
                  + Add Personal Rule
                </button>
              </div>

              {rulesList.length === 0 ? (
                <div className="rounded-md border border-dashed border-edge/80 p-3 text-center text-xs text-ink-muted font-serif italic">
                  No personal rules added. All 32 company-wide common rules apply automatically.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="hidden sm:grid grid-cols-12 gap-2 text-[10.5px] font-bold text-ink-muted px-1.5 uppercase tracking-wider">
                    <span className="col-span-4">Keywords</span>
                    <span className="col-span-2">Issue Key</span>
                    <span className="col-span-3">Account</span>
                    <span className="col-span-2">Category</span>
                    <span className="col-span-1 text-right">Action</span>
                  </div>

                  {rulesList.map((r, idx) => (
                    <div
                      key={r.id}
                      className="rounded-md border border-edge/80 bg-surface p-2 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={r.ruleStr}
                          onChange={(e) => {
                            const updated = [...rulesList];
                            updated[idx].ruleStr = e.target.value;
                            setRulesList(updated);
                          }}
                          placeholder="e.g. My Team Sync"
                          className={`${inputCls} font-mono text-xs`}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={r.issue}
                          onChange={(e) => {
                            const updated = [...rulesList];
                            updated[idx].issue = e.target.value;
                            setRulesList(updated);
                          }}
                          placeholder="197032"
                          className={`${inputCls} font-mono text-xs`}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <select
                          value={r.account}
                          onChange={(e) => {
                            const updated = [...rulesList];
                            updated[idx].account = e.target.value;
                            setRulesList(updated);
                          }}
                          className={`${inputCls} text-xs font-mono`}
                        >
                          {OFFICIAL_ACCOUNTS.map((acc) => (
                            <option key={acc.key} value={acc.key}>
                              {acc.key} ({acc.type})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          value={r.type}
                          onChange={(e) => {
                            const updated = [...rulesList];
                            updated[idx].type = e.target.value;
                            setRulesList(updated);
                          }}
                          className={`${inputCls} text-xs`}
                        >
                          {OFFICIAL_INVESTMENT_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setRulesList(rulesList.filter((item) => item.id !== r.id))}
                          className="cursor-pointer text-ink-muted hover:text-danger p-1 text-xs transition-colors"
                          title="Delete Rule"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="rounded-[7px] bg-accent px-[18px] py-[9px] text-[13px] font-bold text-accent-ink hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <DeferredSpinner isPending={saveMut.isPending} className="h-3.5 w-3.5 text-current" />
              {saved ? "Saved AutoTempo Config ✓" : "Save AutoTempo Settings"}
            </button>
          </div>
        </div>
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
