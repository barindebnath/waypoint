"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { authClient } from "@/lib/auth-client";

type ApiKeyRow = {
  id: string;
  name: string | null;
  start: string | null;
  createdAt: string | Date;
  lastRequest: string | Date | null;
  metadata?: unknown;
};

export default function SettingsPage() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: api.me });
  if (!me) {
    return <main className="flex-1 py-16 text-center text-sm text-ink-faint">Loading…</main>;
  }
  return <SettingsForm key={me.userId} me={me} />;
}

function SettingsForm({
  me,
}: {
  me: { userId: string; timezone: string; jiraBaseUrl: string | null; githubBaseUrl: string | null };
}) {
  const qc = useQueryClient();
  const [timezone, setTimezone] = useState(me.timezone);
  const [jira, setJira] = useState(me.jiraBaseUrl ?? "");
  const [github, setGithub] = useState(me.githubBaseUrl ?? "");
  const [saved, setSaved] = useState(false);

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

  async function createToken(e: React.FormEvent) {
    e.preventDefault();
    setTokenError(null);
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
  }

  const timezones =
    typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Asia/Kolkata", "UTC"];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-4 pb-12">
      <h1 className="text-base font-semibold">Settings</h1>

      {/* Profile / link templates */}
      <section className="rounded-lg border border-edge bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium">Timezone & link templates</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMut.mutate();
          }}
          className="space-y-3 text-sm"
        >
          <label className="block">
            <span className="mb-1 block text-xs text-ink-muted">
              Timezone (day/week/month bucketing happens here)
            </span>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded border border-edge bg-surface-2 px-2 py-1.5"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-muted">
              Jira base URL — makes every Jira ref a one-click link (e.g.{" "}
              <span className="font-mono">https://yourorg.atlassian.net</span>)
            </span>
            <input
              type="url"
              value={jira}
              onChange={(e) => setJira(e.target.value)}
              placeholder="https://…"
              className="w-full rounded border border-edge bg-surface-2 px-2 py-1.5 font-mono text-xs"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-muted">
              GitHub org URL — makes PR refs like <span className="font-mono">repo#123</span>{" "}
              clickable (e.g. <span className="font-mono">https://github.com/yourorg</span>)
            </span>
            <input
              type="url"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/…"
              className="w-full rounded border border-edge bg-surface-2 px-2 py-1.5 font-mono text-xs"
            />
          </label>
          <button
            type="submit"
            disabled={saveMut.isPending}
            className="rounded bg-live/90 px-3 py-1.5 text-sm font-medium text-bg hover:bg-live disabled:opacity-50"
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
        </form>
      </section>

      {/* PATs */}
      <section className="rounded-lg border border-edge bg-surface p-4">
        <h2 className="mb-1 text-sm font-medium">Personal access tokens</h2>
        <p className="mb-3 text-xs text-ink-muted">
          For AI agents and scripts. Shown once, hashed at rest, revocable. Point your agent at{" "}
          <a href="/llms.txt" target="_blank" className="font-mono text-live hover:underline">
            /llms.txt
          </a>{" "}
          for usage instructions.
        </p>

        {freshToken && (
          <div className="mb-3 rounded border border-warn/40 bg-warn/10 p-2 text-xs">
            <p className="mb-1 text-warn">Copy this token now — it won&apos;t be shown again:</p>
            <code className="block select-all break-all rounded bg-surface-2 p-2 font-mono">{freshToken}</code>
            <button onClick={() => setFreshToken(null)} className="mt-1 text-ink-muted hover:underline">
              Done, hide it
            </button>
          </div>
        )}

        <form onSubmit={createToken} className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <input
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="Token name (e.g. claude-code)"
            className="w-48 rounded border border-edge bg-surface-2 px-2 py-1.5 text-xs"
          />
          <select
            value={tokenScope}
            onChange={(e) => setTokenScope(e.target.value as "read" | "read,write")}
            className="rounded border border-edge bg-surface-2 px-2 py-1.5 text-xs"
          >
            <option value="read,write">read + write</option>
            <option value="read">read only</option>
          </select>
          <button type="submit" className="rounded border border-edge px-3 py-1.5 text-xs hover:bg-surface-2">
            Create token
          </button>
          {tokenError && <span className="text-xs text-danger">{tokenError}</span>}
        </form>

        <ul className="divide-y divide-edge text-xs">
          {(keys ?? []).map((k) => (
            <li key={k.id} className="flex items-center gap-3 py-2">
              <span className="font-medium">{k.name ?? "unnamed"}</span>
              <span className="font-mono text-ink-faint">{k.start}…</span>
              <span className="text-ink-faint">
                {k.lastRequest ? `last used ${new Date(k.lastRequest).toLocaleDateString()}` : "never used"}
              </span>
              <button
                onClick={async () => {
                  if (window.confirm(`Revoke token "${k.name ?? k.id}"?`)) {
                    await authClient.apiKey.delete({ keyId: k.id });
                    refetchKeys();
                  }
                }}
                className="ml-auto rounded border border-edge px-2 py-0.5 text-ink-faint hover:border-danger/50 hover:text-danger"
              >
                Revoke
              </button>
            </li>
          ))}
          {(keys ?? []).length === 0 && <li className="py-2 text-ink-faint">No tokens yet.</li>}
        </ul>
      </section>

      {/* Data rights */}
      <section className="rounded-lg border border-edge bg-surface p-4">
        <h2 className="mb-1 text-sm font-medium">Your data</h2>
        <p className="mb-3 text-xs text-ink-muted">
          Export everything as JSON, or permanently delete the account and all its data. See{" "}
          <a href="/privacy" className="text-live hover:underline">
            privacy
          </a>
          .
        </p>
        <div className="flex items-center gap-2">
          <a
            href="/api/v1/export"
            download
            className="rounded border border-edge px-3 py-1.5 text-xs hover:bg-surface-2"
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
            className="rounded border border-danger/40 px-3 py-1.5 text-xs text-danger hover:bg-danger/10"
          >
            Delete account…
          </button>
        </div>
      </section>
    </main>
  );
}
