"use client";

import { useState, useSyncExternalStore, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { authClient } from "@/lib/auth-client";
import { OFFICIAL_ACCOUNTS, OFFICIAL_INVESTMENT_CATEGORIES, SYSTEM_COMMON_RULES } from "@/lib/timesheet-shared";
import { getThemePref, setThemePref, subscribeTheme, type ThemePref } from "@/lib/theme";
import { getColorThemePref, normalizeColorTheme, setColorThemePref, subscribeColorTheme, type ColorThemePref } from "@/lib/color-theme";
import { getFontThemePref, normalizeFontTheme, setFontThemePref, subscribeFontTheme, type FontThemePref } from "@/lib/font-theme";
import { DeferredSpinner } from "@/components/deferred-spinner";
import {
  AlertIcon,
  CheckCircleIcon,
  CheckIcon,
  CloseIcon,
  KeyIcon,
  LinkIcon,
  MonitorIcon,
  MoonIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  SlidersIcon,
  SparkleIcon,
  SunIcon,
  TimesheetIcon,
  UserIcon,
} from "@/components/icons";
import { PageHeader, btnDanger, btnPrimary, btnSecondary } from "@/components/ui";

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

/** A swatch colour that is split on a slant: the light value on the left, the dark value on the right. */
const split = (light: string, dark: string, at = 55) => `linear-gradient(105deg, ${light} ${at}%, ${dark} ${at}%)`;

/** The title of a settings section: a small icon tile and the text. */
function SectionTitle({ icon, children, className = "mb-1" }: { icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`flex items-center gap-2.5 text-[15px] font-semibold tracking-tight ${className}`}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent-fg [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      {children}
    </h2>
  );
}

/** A choice card with a preview, a label and a line of text. The chosen card has a lime outline and a tick. */
function ChoiceCard({
  on,
  disabled = false,
  onClick,
  preview,
  label,
  desc,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
  preview: React.ReactNode;
  label: React.ReactNode;
  desc: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`relative flex flex-col gap-2.5 rounded-2xl border-2 bg-surface-2 p-3 text-left transition-colors ${
        on ? "border-accent" : "border-transparent hover:border-edge-strong"
      } ${disabled ? "cursor-not-allowed opacity-75" : ""}`}
    >
      {preview}
      <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${on ? "text-accent-fg" : "text-ink"}`}>{label}</span>
      <span className="text-[11.5px] leading-tight text-ink-faint">{desc}</span>
      {on && (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-accent text-accent-ink">
          <CheckIcon className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}

/** A small preview of a palette: a background with three bars. */
function Swatch({ bg, ink, accent, muted }: { bg: string; ink: string; accent: string; muted: string }) {
  return (
    <span className="relative block h-12 overflow-hidden rounded-xl border border-edge" style={{ background: bg }}>
      <span className="absolute left-2.5 top-2.5 h-1.5 w-11 rounded-full" style={{ background: ink }} />
      <span className="absolute left-2.5 top-[22px] h-1.5 w-7 rounded-full" style={{ background: accent }} />
      <span className="absolute left-2.5 top-[34px] h-1.5 w-14 rounded-full" style={{ background: muted }} />
    </span>
  );
}

/* Swatches of the default (lime) palette in each mode. */
const THEME_CARDS: {
  key: ThemePref;
  label: string;
  icon: typeof SunIcon;
  desc: string;
  swBg: string;
  swInk: string;
  swAccent: string;
  swMuted: string;
}[] = [
  { key: "light", label: "Light", icon: SunIcon, desc: "Soft white panels, always.", swBg: "#f6f6f2", swInk: "#161612", swAccent: "#93d00e", swMuted: "#c6c6bb" },
  { key: "dark", label: "Dark", icon: MoonIcon, desc: "Charcoal panels, always.", swBg: "#111111", swInk: "#f5f5f3", swAccent: "#93d00e", swMuted: "#3b3b3b" },
  { key: "system", label: "System", icon: MonitorIcon, desc: "Follows your OS setting.", swBg: split("#f6f6f2", "#111111"), swInk: split("#161612", "#f5f5f3", 60), swAccent: "#93d00e", swMuted: split("#c6c6bb", "#3b3b3b", 70) },
];

function AppearanceSection() {
  const pref = useSyncExternalStore(subscribeTheme, getThemePref, () => "dark" as const);
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5">
      <SectionTitle icon={<MoonIcon />}>Appearance</SectionTitle>
      <p className="mb-4 text-xs leading-relaxed text-ink-muted">Theme applies instantly and is remembered on this device.</p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3" suppressHydrationWarning>
        {THEME_CARDS.map((t) => (
          <ChoiceCard
            key={t.key}
            on={pref === t.key}
            onClick={() => setThemePref(t.key)}
            preview={<Swatch bg={t.swBg} ink={t.swInk} accent={t.swAccent} muted={t.swMuted} />}
            label={
              <>
                <t.icon className="h-4 w-4" />
                {t.label}
              </>
            }
            desc={t.desc}
          />
        ))}
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
  { key: "lime", label: "Lime", desc: "Charcoal panels, lime accent.", swBg: split("#f6f6f2", "#111111"), swInk: split("#161612", "#f5f5f3", 60), swAccent: "#93d00e", swMuted: split("#c6c6bb", "#3b3b3b", 70) },
  { key: "paper", label: "Paper", desc: "Warm sepia, amber accent.", swBg: split("#f5efe3", "#151109"), swInk: split("#241d10", "#ede4cd", 60), swAccent: split("#b4501e", "#e08a4e", 40), swMuted: split("#c8bb9a", "#4d442a", 70) },
  { key: "nord", label: "Nordic", desc: "Cool grey, blue/teal accent.", swBg: split("#eef2f7", "#0f172a"), swInk: split("#0f172a", "#f8fafc", 60), swAccent: split("#0284c7", "#38bdf8", 40), swMuted: split("#94a3b8", "#475569", 70) },
  { key: "royal", label: "Royal", desc: "Rich purple, gold/lavender.", swBg: split("#f5f0f6", "#150d1b"), swInk: split("#24112c", "#ebdff0", 60), swAccent: split("#7b2cb1", "#d896ff", 40), swMuted: split("#b796c3", "#583e6d", 70) },
];

function ColorPaletteSection() {
  const pref = useSyncExternalStore(subscribeColorTheme, getColorThemePref, () => "lime" as const);
  const qc = useQueryClient();

  const themeMut = useMutation({
    mutationFn: (theme: ColorThemePref) => api.updateMe({ colorTheme: theme }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  return (
    <section className="rounded-2xl border border-edge bg-surface p-5">
      <SectionTitle icon={<SparkleIcon />}>Color Palette</SectionTitle>
      <p className="mb-4 text-xs leading-relaxed text-ink-muted">Choose a theme variant. Applies to both light and dark modes.</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-4" suppressHydrationWarning>
        {COLOR_THEME_CARDS.map((t) => (
          <ChoiceCard
            key={t.key}
            on={pref === t.key}
            disabled={themeMut.isPending}
            onClick={() => {
              setColorThemePref(t.key);
              themeMut.mutate(t.key);
            }}
            preview={<Swatch bg={t.swBg} ink={t.swInk} accent={t.swAccent} muted={t.swMuted} />}
            label={
              <>
                {t.label}
                <DeferredSpinner isPending={themeMut.isPending && themeMut.variables === t.key} className="h-3 w-3" />
              </>
            }
            desc={t.desc}
          />
        ))}
      </div>
    </section>
  );
}

const FONT_THEME_CARDS: {
  key: FontThemePref;
  label: string;
  desc: string;
}[] = [
  { key: "sans", label: "Sans-Serif", desc: "Clean & contemporary." },
  { key: "serif", label: "Serif", desc: "Warm literary style." },
  { key: "mono", label: "Monospace", desc: "Bold developer feel." },
];

function FontStyleSection() {
  const pref = useSyncExternalStore(subscribeFontTheme, getFontThemePref, () => "sans" as const);
  const qc = useQueryClient();

  const fontMut = useMutation({
    mutationFn: (font: FontThemePref) => api.updateMe({ fontTheme: font }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const getFamilyStyle = (key: FontThemePref) => {
    if (key === "serif") return { fontFamily: "var(--font-newsreader), Georgia, serif" };
    if (key === "sans") return { fontFamily: "var(--font-inter), ui-sans-serif, system-ui, -apple-system, sans-serif" };
    if (key === "mono") return { fontFamily: "var(--font-plex-mono), ui-monospace, monospace" };
    return {};
  };

  return (
    <section className="rounded-2xl border border-edge bg-surface p-5">
      <SectionTitle icon={<span className="text-[15px] font-semibold leading-none">Aa</span>}>Font Style</SectionTitle>
      <p className="mb-4 text-xs leading-relaxed text-ink-muted">Choose your preferred typography category for headings and UI accents.</p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3" suppressHydrationWarning>
        {FONT_THEME_CARDS.map((t) => (
          <ChoiceCard
            key={t.key}
            on={pref === t.key}
            disabled={fontMut.isPending}
            onClick={() => {
              setFontThemePref(t.key);
              fontMut.mutate(t.key);
            }}
            preview={
              <span
                className="relative flex h-12 items-center justify-center rounded-xl border border-edge bg-surface"
                style={getFamilyStyle(t.key)}
              >
                <span className="text-2xl font-medium text-ink">Aa</span>
              </span>
            }
            label={
              <span className="flex items-center gap-1.5" style={getFamilyStyle(t.key)}>
                {t.label}
                <DeferredSpinner isPending={fontMut.isPending && fontMut.variables === t.key} className="h-3 w-3" />
              </span>
            }
            desc={t.desc}
          />
        ))}
      </div>
    </section>
  );
}

const inputCls =
  "h-10 w-full rounded-xl border border-edge bg-surface-2 px-3.5 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent";

/* Integration secrets are write-only: /me reports only whether each one is set. */
type SecretKey = "jiraApiToken" | "githubPat" | "tempoApiToken" | "msClientSecret" | "msRefreshToken";
type SecretDraft = { value: string; clear: boolean };
const EMPTY_SECRET_DRAFTS: Record<SecretKey, SecretDraft> = {
  jiraApiToken: { value: "", clear: false },
  githubPat: { value: "", clear: false },
  tempoApiToken: { value: "", clear: false },
  msClientSecret: { value: "", clear: false },
  msRefreshToken: { value: "", clear: false },
};

/** PATCH value for a secret: null clears it, a new value replaces it, undefined (omitted) keeps it. */
function secretPatch(d: SecretDraft): string | null | undefined {
  if (d.clear) return null;
  return d.value.trim() || undefined;
}

function SecretInput({
  label,
  name,
  placeholder,
  isSet,
  draft,
  onChange,
}: {
  label: string;
  name: string;
  placeholder: string;
  isSet: boolean;
  draft: SecretDraft;
  onChange: (d: SecretDraft) => void;
}) {
  // A blank field keeps the stored secret, so tell the user that one is saved.
  const hint = draft.clear
    ? "Will be cleared on save"
    : isSet
      ? "•••••••• saved — leave blank to keep"
      : placeholder;
  return (
    <div className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-muted">
        <span>{label}</span>
        {(isSet || draft.clear) && (
          <button
            type="button"
            onClick={() => onChange({ value: "", clear: !draft.clear })}
            className="text-[11px] font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            {draft.clear ? "Undo clear" : "Clear"}
          </button>
        )}
      </span>
      <input
        type="text"
        name={name}
        aria-label={label}
        autoComplete="off"
        style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
        value={draft.value}
        // Typing a new value cancels a pending clear: the new value replaces the stored one.
        onChange={(e) => onChange({ value: e.target.value, clear: false })}
        placeholder={hint}
        className={`${inputCls} font-mono text-xs`}
      />
    </div>
  );
}

export default function SettingsPage() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: api.me });
  if (!me) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-ink-faint">Loading…</div>
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
    githubBaseUrl: string | null;
    githubDefaultOrg: string | null;
    colorTheme: string;
    fontTheme: string;
    showTimesheet: boolean;
    jiraAccountId: string | null;
    msClientId: string | null;
    autoTempoDefaultRule: unknown;
    autoTempoSkipDays: unknown;
    autoTempoRules: unknown;
    autoTempoScheduled: boolean;
    hasJiraApiToken: boolean;
    hasGithubPat: boolean;
    hasTempoApiToken: boolean;
    hasMsClientSecret: boolean;
    hasMsRefreshToken: boolean;
  };
}) {
  const qc = useQueryClient();
  const [timezone, setTimezone] = useState(me.timezone);
  const [jira, setJira] = useState(me.jiraBaseUrl ?? "");
  const [jiraEmail, setJiraEmail] = useState(me.jiraEmail ?? "");
  const [github, setGithub] = useState(me.githubBaseUrl ?? "");
  const [githubDefaultOrg] = useState(me.githubDefaultOrg ?? "");

  // AutoTempo states
  const [jiraAccountId, setJiraAccountId] = useState(me.jiraAccountId ?? "");
  const [msClientId, setMsClientId] = useState(me.msClientId ?? "");
  // Secret inputs start empty: the stored values never reach the browser.
  const [secrets, setSecrets] = useState(EMPTY_SECRET_DRAFTS);
  const setSecret = (key: SecretKey) => (d: SecretDraft) => setSecrets((prev) => ({ ...prev, [key]: d }));

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

  const [autoTempoScheduled, setAutoTempoScheduled] = useState(me.autoTempoScheduled);

  const [ruleSearch, setRuleSearch] = useState("");
  const [showSystemRules, setShowSystemRules] = useState(false);

  const [saved, setSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    if (me.colorTheme) {
      // A saved "forest" (the old default palette) shows as "lime".
      const saved = normalizeColorTheme(me.colorTheme);
      if (getColorThemePref() !== saved) {
        setColorThemePref(saved);
      }
    }
  }, [me.colorTheme]);

  useEffect(() => {
    if (me.fontTheme) {
      // An old saved value that is not a font theme shows as the default.
      const saved = normalizeFontTheme(me.fontTheme);
      if (getFontThemePref() !== saved) {
        setFontThemePref(saved);
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
        jiraApiToken: secretPatch(secrets.jiraApiToken),
        githubBaseUrl: github.trim() || null,
        githubPat: secretPatch(secrets.githubPat),
        githubDefaultOrg: githubDefaultOrg.trim() || null,
        showTimesheet: true,
        tempoApiToken: secretPatch(secrets.tempoApiToken),
        jiraAccountId: jiraAccountId.trim() || null,
        msClientId: msClientId.trim() || null,
        msClientSecret: secretPatch(secrets.msClientSecret),
        msRefreshToken: secretPatch(secrets.msRefreshToken),
        autoTempoSkipDays: skipDays,
        autoTempoRules: formattedRules,
        autoTempoScheduled,
      });
    },
    onSuccess: () => {
      // Drop the typed secrets from component state; the refetched /me shows them as saved.
      setSecrets(EMPTY_SECRET_DRAFTS);
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader icon={<SlidersIcon />} title="Settings" subtitle="Appearance, integrations, tokens and your data" />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">

      {/*
        Three column groups: appearance | AutoTempo | links, tokens and data.
        From lg there are two columns. AutoTempo is on the right and spans both rows,
        so the third group sits under the first with no gap. From 2xl there are three columns.
        Narrow screens stack the groups in the original section order.
      */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
          <AppearanceSection />
          <ColorPaletteSection />
          <FontStyleSection />


        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 2xl:row-span-1">
          {/* AutoTempo Integration & Rules */}
          <section className="rounded-2xl border border-edge bg-surface p-5">
            <SectionTitle icon={<TimesheetIcon />}>AutoTempo Integration &amp; Rules</SectionTitle>
            <p className="mb-4 text-xs leading-relaxed text-ink-muted">
              Configure Tempo API token, Jira Account ID, Microsoft Outlook Graph credentials, and matching rules to auto-fill worklogs.
            </p>
            <div className="flex flex-col gap-3.5 text-[13px]">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <SecretInput
                  label="Tempo API Token"
                  name="tempo_api_token_setting"
                  placeholder="Log into Tempo -> Settings -> API Integration -> New Token"
                  isSet={me.hasTempoApiToken}
                  draft={secrets.tempoApiToken}
                  onChange={setSecret("tempoApiToken")}
                />
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
                <SecretInput
                  label="MS Client Secret (Optional)"
                  name="ms_client_secret_setting"
                  placeholder="Secret value"
                  isSet={me.hasMsClientSecret}
                  draft={secrets.msClientSecret}
                  onChange={setSecret("msClientSecret")}
                />
                <SecretInput
                  label="MS Refresh Token"
                  name="ms_refresh_token_setting"
                  placeholder="OAuth Refresh Token"
                  isSet={me.hasMsRefreshToken}
                  draft={secrets.msRefreshToken}
                  onChange={setSecret("msRefreshToken")}
                />
              </div>

              {/* Waypoint Rows Allocation Notice */}
              <div className="flex flex-col gap-1.5 rounded-xl bg-surface-2 p-4">
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
                        aria-pressed={isSkipped}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors ${
                          isSkipped
                            ? "bg-accent-soft text-accent-fg ring-1 ring-accent/40"
                            : "bg-surface-2 text-ink-faint hover:bg-surface-3 hover:text-ink"
                        }`}
                      >
                        {dayName}
                        {isSkipped && <CheckIcon className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weekly schedule opt-in */}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface-2 p-4">
                <input
                  type="checkbox"
                  checked={autoTempoScheduled}
                  onChange={(e) => setAutoTempoScheduled(e.target.checked)}
                  className="wp-check mt-0.5"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-ink">Run AutoTempo every Friday</span>
                  <span className="text-[11px] text-ink-muted">
                    The server fills your unfilled days each Friday at about 18:00 IST (12:30 UTC). Each run replaces your existing Tempo worklogs on the days it fills.
                  </span>
                </span>
              </label>

              {/* Company Common Rules Banner & Personal Overrides */}
              <div className="flex flex-col gap-3">
                {/* Company Common Rules Banner */}
                <div className="flex flex-col gap-3 rounded-xl bg-done-soft p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-done">
                        <CheckCircleIcon className="h-4 w-4" />
                        Company-Wide Common Rules
                      </span>
                      <span className="rounded-full bg-done/20 px-2 py-0.5 text-[10px] font-bold text-done">
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
                    className="h-9 shrink-0 rounded-full bg-surface px-4 text-xs font-semibold text-ink-muted ring-1 ring-edge transition-colors hover:text-ink hover:ring-edge-strong"
                  >
                    {showSystemRules ? "Hide System Rules" : `Inspect System Rules (${SYSTEM_COMMON_RULES.length})`}
                  </button>
                </div>

                {/* Read-Only System Rules Viewer */}
                {showSystemRules && (
                  <div className="flex animate-fade-in flex-col gap-2.5 rounded-xl bg-surface-2 p-4">
                    <div className="flex items-center justify-between gap-2 border-b border-edge/60 pb-2">
                      <span className="text-xs font-semibold text-ink">System Common Rules Directory</span>
                      <div className="relative">
                        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                        <input
                          type="text"
                          value={ruleSearch}
                          onChange={(e) => setRuleSearch(e.target.value)}
                          placeholder="Search system rules…"
                          aria-label="Search system rules"
                          className="h-9 w-44 rounded-full border border-edge bg-surface pl-9 pr-3.5 text-xs text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent sm:w-56"
                        />
                      </div>
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
                        <div key={i} className="grid grid-cols-1 items-center gap-2 rounded-xl bg-surface p-2.5 text-xs sm:grid-cols-12">
                          <div className="sm:col-span-5 font-mono text-[11.5px] text-ink">
                            {Array.isArray(r.rule) ? r.rule.join(", ") : r.rule}
                            {r.skip && <span className="ml-2 text-[10px] text-warn font-semibold">(Skipped)</span>}
                          </div>
                          <div className="sm:col-span-2 font-mono text-ink-muted text-[11px]">
                            {r.issue || "—"}
                          </div>
                          <div className="sm:col-span-3 font-mono text-accent-fg text-[11px]">
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
                <div className="flex flex-col gap-2.5 rounded-xl bg-surface-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
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
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface px-4 text-xs font-semibold text-accent-fg ring-1 ring-edge transition-colors hover:ring-accent"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      Add Personal Rule
                    </button>
                  </div>

                  {rulesList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-edge-strong/60 p-4 text-center text-xs text-ink-muted">
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
                          className="grid grid-cols-1 items-center gap-2 rounded-xl bg-surface p-2.5 sm:grid-cols-12"
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
                              className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-danger/10 hover:text-danger"
                              title="Delete Rule"
                              aria-label="Delete rule"
                            >
                              <CloseIcon className="h-4 w-4" />
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
                  className={btnPrimary}
                >
                  <DeferredSpinner isPending={saveMut.isPending} className="h-3.5 w-3.5 text-current" />
                  {saved ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Saved AutoTempo Config
                    </>
                  ) : (
                    "Save AutoTempo Settings"
                  )}
                </button>
              </div>
            </div>
          </section>

        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-2 2xl:col-start-3 2xl:row-start-1">
          {/* Timezone & link templates */}
          <section className="rounded-2xl border border-edge bg-surface p-5">
            <SectionTitle icon={<LinkIcon />} className="mb-4">Timezone &amp; link templates</SectionTitle>
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
                <SecretInput
                  label="Jira API Token"
                  name="jira_api_token_setting"
                  placeholder="ATATT3xFfGF0..."
                  isSet={me.hasJiraApiToken}
                  draft={secrets.jiraApiToken}
                  onChange={setSecret("jiraApiToken")}
                />
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
                <SecretInput
                  label="GitHub Personal Access Token (PAT)"
                  name="github_pat_setting"
                  placeholder="ghp_xxxxxxxxxxxx"
                  isSet={me.hasGithubPat}
                  draft={secrets.githubPat}
                  onChange={setSecret("githubPat")}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending}
                  className={btnPrimary}
                >
                  <DeferredSpinner isPending={saveMut.isPending} className="h-3.5 w-3.5 text-current" />
                  {saved ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  type="button"
                  disabled={syncMut.isPending}
                  onClick={() => syncMut.mutate()}
                  className={btnSecondary}
                >
                  <DeferredSpinner isPending={syncMut.isPending} className="h-3.5 w-3.5 text-current" />
                  {!syncMut.isPending && <RefreshIcon className="h-4 w-4 text-ink-muted" />}
                  Sync Integrations Now
                </button>
              </div>
              {syncStatus && <p className="text-xs text-accent-fg font-medium mt-1">{syncStatus}</p>}
              {syncMessages.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5 rounded-xl bg-warn/10 p-3 text-xs text-warn">
                  {syncMessages.map((msg, i) => (
                    <p key={i} className="flex items-start gap-1.5">
                      <AlertIcon className="mt-px h-3.5 w-3.5 shrink-0" />
                      {msg}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* PATs */}
          <section className="rounded-2xl border border-edge bg-surface p-5">
            <SectionTitle icon={<KeyIcon />}>Personal access tokens</SectionTitle>
            <p className="mb-4 text-xs leading-relaxed text-ink-muted">
              For AI agents and scripts. Shown once, hashed at rest, revocable. Point your agent at{" "}
              <a href="/llms.txt" target="_blank" className="font-mono">
                /llms.txt
              </a>{" "}
              for usage instructions.
            </p>

            {freshToken && (
              <div className="mb-4 rounded-2xl border border-warn/60 bg-warn/10 p-4 text-xs">
                <p className="mb-2 font-semibold text-warn">
                  Copy this token now — it won&apos;t be shown again:
                </p>
                <code className="block select-all break-all rounded-xl bg-surface-2 p-3 font-mono text-[11.5px]">
                  {freshToken}
                </code>
                <button
                  onClick={() => setFreshToken(null)}
                  className="mt-2.5 text-[11.5px] text-ink-muted underline transition-colors hover:text-ink"
                >
                  Done, hide it
                </button>
              </div>
            )}

            <form onSubmit={createToken} className="mb-4 flex flex-wrap gap-2">
              <input
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="Token name (e.g. claude-code)"
                className="h-10 w-[190px] rounded-xl border border-edge bg-surface-2 px-3.5 text-xs outline-none transition-colors placeholder:text-ink-faint focus:border-accent"
              />
              <select
                value={tokenScope}
                onChange={(e) => setTokenScope(e.target.value as "read" | "read,write")}
                className="h-10 rounded-xl border border-edge bg-surface-2 px-3 text-xs outline-none focus:border-accent"
              >
                <option value="read,write">read + write</option>
                <option value="read">read only</option>
              </select>
              <button
                type="submit"
                disabled={creatingToken}
                className={btnSecondary}
              >
                <DeferredSpinner isPending={creatingToken} className="h-3 w-3 text-current" />
                Create token
              </button>
              {tokenError && <span className="text-xs text-danger">{tokenError}</span>}
            </form>

            <ul className="text-xs">
              {(keys ?? []).map((k) => (
                <li key={k.id} className="flex flex-wrap items-center gap-3 border-t border-edge py-3">
                  <span className="font-semibold">{k.name ?? "unnamed"}</span>
                  <span className="font-mono text-ink-faint">{k.start}…</span>
                  <span className="text-ink-faint">
                    {k.lastRequest ? `last used ${new Date(k.lastRequest).toLocaleDateString()}` : "never used"}
                  </span>
                  <span className="rounded-full bg-surface-3 px-2 py-0.5 font-mono text-[10px] text-ink-muted">
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
                    className="ml-auto flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[11px] text-ink-faint ring-1 ring-edge transition-colors hover:bg-danger/10 hover:text-danger hover:ring-danger/40 disabled:opacity-50"
                  >
                    <DeferredSpinner isPending={revokingKeyId === k.id} className="h-3 w-3 text-current" />
                    Revoke
                  </button>
                </li>
              ))}
              {(keys ?? []).length === 0 && (
                <li className="border-t border-edge py-3 text-ink-faint">No tokens yet.</li>
              )}
            </ul>
          </section>

          {/* Data rights */}
          <section className="rounded-2xl border border-edge bg-surface p-5">
            <SectionTitle icon={<UserIcon />}>Your data</SectionTitle>
            <p className="mb-4 text-xs leading-relaxed text-ink-muted">
              Export everything as JSON, or permanently delete the account and all its data. See{" "}
              <a href="/privacy">privacy</a>.
            </p>
            <div className="flex gap-2.5">
              <a
                href="/api/v1/export"
                download
                className={`${btnSecondary} no-underline`}
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
                className={btnDanger}
              >
                Delete account…
              </button>
            </div>
          </section>
        </div>
      </div>
      </main>
    </div>
  );
}
