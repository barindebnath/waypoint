import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DocsSidebar } from "@/components/docs-sidebar";

export const metadata = {
  title: "Waypoint API — docs",
  description: "Automate your Waypoint tracker with any AI: authentication, data model, and every endpoint.",
};

/* ---------- tiny presentational helpers ---------- */

function Verb({ v }: { v: "GET" | "POST" | "PATCH" | "DELETE" }) {
  const cls =
    v === "GET"
      ? "bg-done/15 text-done"
      : v === "POST"
        ? "bg-support/15 text-support"
        : v === "PATCH"
          ? "bg-live/15 text-live"
          : "bg-danger/15 text-danger";
  return <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide ${cls}`}>{v}</span>;
}

function Ep({ v, path, children }: { v: "GET" | "POST" | "PATCH" | "DELETE"; path: string; children?: React.ReactNode }) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-edge">
      <div className="flex flex-wrap items-center gap-3 border-b border-edge bg-surface px-4 py-3 font-mono text-sm">
        <Verb v={v} />
        <span>{path}</span>
      </div>
      {children && <div className="px-4 py-3.5 text-sm text-ink-muted [&_p]:mb-2 [&_p:last-child]:mb-0">{children}</div>}
    </div>
  );
}

function Note({ tone, title, children }: { tone: "info" | "good" | "warn" | "danger"; title: string; children: React.ReactNode }) {
  const cls =
    tone === "good"
      ? "border-done/40 bg-done/10 [&_.h]:text-done"
      : tone === "warn"
        ? "border-warn/40 bg-warn/10 [&_.h]:text-warn"
        : tone === "danger"
          ? "border-danger/40 bg-danger/10 [&_.h]:text-danger"
          : "border-edge bg-surface [&_.h]:text-ink-muted";
  return (
    <div className={`my-5 max-w-3xl rounded-xl border p-4 text-sm ${cls}`}>
      <p className="h mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em]">{title}</p>
      <div className="text-ink-muted">{children}</div>
    </div>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-3 mt-14 scroll-mt-20 font-serif text-2xl font-medium tracking-tight first:mt-0">
      {children}
    </h2>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="my-4 max-w-3xl overflow-x-auto rounded-xl border border-edge bg-surface-2 p-4 font-mono text-[13px] leading-relaxed text-ink">
      {children}
    </pre>
  );
}

function Fields({ rows }: { rows: [string, string, string][] }) {
  return (
    <table className="my-3 w-full max-w-3xl border-collapse text-[13px]">
      <thead>
        <tr>
          {["Field", "Type", "Notes"].map((h) => (
            <th key={h} className="border-b border-edge px-3 py-2 text-left font-mono text-[10px] font-normal uppercase tracking-wider text-ink-faint">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([f, t, n]) => (
          <tr key={f}>
            <td className="whitespace-nowrap border-b border-edge px-3 py-2 font-mono text-ink">{f}</td>
            <td className="border-b border-edge px-3 py-2 text-ink-muted">{t}</td>
            <td className="border-b border-edge px-3 py-2 text-ink-muted">{n}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const NAV = [
  {
    title: "Getting started",
    items: [
      { id: "overview", label: "Overview" },
      { id: "auth", label: "Authentication" },
      { id: "base", label: "Base URL" },
    ],
  },
  {
    title: "Concepts",
    items: [
      { id: "model", label: "Data model" },
      { id: "idempotency", label: "Idempotency" },
      { id: "errors", label: "Errors & limits" },
    ],
  },
  {
    title: "Endpoints",
    items: [
      { id: "ep-rows", label: "Rows" },
      { id: "ep-subtasks", label: "Sub-tasks & regression" },
      { id: "ep-timesheet", label: "Timesheet" },
      { id: "ep-misc", label: "Analytics, me, export" },
    ],
  },
  {
    title: "Automate with AI",
    items: [
      { id: "agents", label: "Agents & llms.txt" },
      { id: "security", label: "Security model" },
    ],
  },
];

import { Logo } from "@/components/logo";

export default async function DocsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-edge bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5 !text-ink">
            <Logo className="h-6 w-6 -mt-0.5" />
            <span className="font-serif text-lg font-semibold">Waypoint</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/llms.txt" className="text-xs text-ink-muted hover:text-ink">
              llms.txt
            </Link>
            <span className="rounded border border-edge px-2 py-0.5 font-mono text-[9px] text-ink-muted select-none">API v1</span>
            {session ? (
              <Link href="/dashboard" className="rounded border border-edge px-2.5 py-1 text-xs text-ink-muted hover:border-edge-strong">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-xs text-ink-muted hover:text-ink">
                  Sign in
                </Link>
                <Link href="/signup" className="rounded bg-accent px-2.5 py-1 text-xs !text-accent-ink hover:opacity-90">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl gap-10 px-5">
        <DocsSidebar groups={NAV} />

        <main className="min-w-0 flex-1 pb-120 pt-10">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-live">Integration guide</p>
          <h1 className="font-serif text-4xl font-medium tracking-tight">Automate your tracker with any AI.</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-muted">
            Everything the Waypoint dashboard does is a small REST API — the dashboard itself is just
            another client. Give an agent a token and it can create rows, tick sub-tasks, regress a
            bounced fix, and attest your timesheet, all as you.
          </p>

          <H2 id="overview">Overview</H2>
          <p className="max-w-2xl text-sm text-ink-muted">
            Waypoint is a <b className="text-ink">status mirror</b>, not an integration hub. It never
            reads from or writes to Jira, GitHub, or Teams — your AI already has its own connections
            to those. The contract: do the real work there, then report what happened here. Progress
            logic (completion, auto-advance, regression) is computed server-side in one engine, so
            the API and the UI can never disagree.
          </p>
          <Note tone="info" title="▣ For agents, there's a shortcut">
            The live instruction file at <code className="font-mono text-live">/llms.txt</code>{" "}teaches an AI
            when to create rows, which pipeline to pick, what to tick, and what never to write. Most
            integrations are one line: &ldquo;fetch the llms.txt and follow it.&rdquo; This page is the
            human-readable superset.
          </Note>

          <H2 id="auth">Authentication</H2>
          <p className="max-w-2xl text-sm text-ink-muted">
            Two audiences, two mechanisms. A person in a browser uses the session cookie
            (HttpOnly, Secure, SameSite, CSRF-protected — handled by the app). Machines use a{" "}
            <b className="text-ink">personal access token</b> created in Settings: shown once, stored
            only as a hash, revocable instantly, scoped <code className="font-mono">read</code>{" "}or{" "}
            <code className="font-mono">read,write</code>.
          </p>
          <Code>
            {`# either header works\nAuthorization: Bearer wp_XXXXXXXXXXXX\nx-api-key: wp_XXXXXXXXXXXX`}
          </Code>
          <Note tone="good" title="● Least privilege">
            Mint the narrowest token the job needs — a reporting script gets <code className="font-mono">read</code>,
            nothing more. Inject tokens as environment secrets; never in client code, prompts, or repos.
          </Note>
          <Note tone="danger" title="✕ Session-only actions">
            Token management and account deletion are deliberately <b>not</b> available to tokens — a
            leaked PAT can move your bars, but it can&apos;t destroy your account or mint new keys.
          </Note>

          <H2 id="base">Base URL &amp; versioning</H2>
          <Code>{`https://waypoint-bd.vercel.app/api/v1`}</Code>
          <p className="max-w-2xl text-sm text-ink-muted">
            The API lives on the same host as the app; the version is in the path. Additive fields may
            appear within <code className="font-mono">v1</code> — parse defensively and ignore unknown keys.
          </p>

          <H2 id="model">Data model</H2>
          <ul className="max-w-2xl list-disc space-y-2 pl-5 text-sm text-ink-muted">
            <li>
              <b className="text-ink">Row</b> — one unit of work. Identified by its{" "}
              <b className="text-ink">identity card ref</b> (the ZT card for support work, the OFF/PES
              card for product work), unique per user. Rows have <b className="text-ink">no title</b>;
              secondary refs (dupe card, PRs) ride along as pills and may repeat across rows.
            </li>
            <li>
              <b className="text-ink">Pipeline</b> — <code className="font-mono">support_full</code>,{" "}
              <code className="font-mono">support_light</code>, or <code className="font-mono">feature</code>,
              chosen at creation (default: support bug → full, support task → light) and{" "}
              <b className="text-ink">immutable</b> afterwards. Pivots and promotions are new rows.
            </li>
            <li>
              <b className="text-ink">Milestones &amp; sub-tasks</b> — every sub-task is mandatory; a
              milestone completes when all are checked, and the bar auto-advances. Unchecking a
              sub-task on a completed row does <i>not</i> move the bar — it creates a{" "}
              <b className="text-ink">loose end</b>.
            </li>
            <li>
              <b className="text-ink">Timesheet week</b> — one object per ISO week
              (<code className="font-mono">2026-W29</code>): five day-attestations plus a submit record.
              Months are derived from each week&apos;s Friday in your timezone; you never write a &ldquo;month&rdquo;.
            </li>
          </ul>
          <Note tone="info" title="▣ Server-authoritative">
            Callers submit facts (&ldquo;this sub-task happened&rdquo;), never state (&ldquo;the bar is at
            80%&rdquo;). Completion, advancement, and user-scoping are computed server-side; an agent
            cannot forge a bar forward or touch rows that aren&apos;t yours.
          </Note>

          <H2 id="idempotency">Idempotency</H2>
          <p className="max-w-2xl text-sm text-ink-muted">
            Send an <code className="font-mono">Idempotency-Key</code>{" "}header (a CI run id, a UUID) on any
            write. The first successful result is stored per user+key and replayed for repeats, with
            the response header <code className="font-mono">Idempotency-Replayed: true</code>. Errors are
            not stored, so a failed call may be retried with the same key.
          </p>
          <Code>{`Idempotency-Key: ci-run-8837f2`}</Code>

          <H2 id="errors">Errors &amp; limits</H2>
          <p className="max-w-2xl text-sm text-ink-muted">
            Errors are <code className="font-mono">{`{ "error": "human-readable message" }`}</code>{" "}with a
            conventional status. Validation messages name the offending field.
          </p>
          <Fields
            rows={[
              ["400", "invalid request", "Malformed JSON, unknown milestone/sub-task key, bad enum, invalid week id."],
              ["401", "unauthenticated", "Missing, invalid, or revoked token; no session."],
              ["403", "forbidden", "Token lacks the write scope, or a session-only action (account deletion) was attempted with a token."],
              ["404", "not found", "No row carries that ref — also what you see for another user's rows; existence never leaks."],
              ["409", "conflict", "Duplicate identity card, submitting an incomplete week, ticking a day on a submitted week."],
            ]}
          />
          <p className="max-w-2xl text-sm text-ink-muted">
            Tokens are rate-limited to <b className="text-ink">240 requests/minute</b>. On 429, back off
            and retry; writes carrying an idempotency key are always safe to retry.
          </p>

          <H2 id="ep-rows">Endpoints · Rows</H2>
          <Ep v="GET" path="/api/v1/rows">
            <p>List every row you own, with full milestone/sub-task state and resolved link URLs. The
            dashboard&apos;s filters (hide completed, date-range inspection) are client-side — the API
            always returns everything.</p>
          </Ep>
          <Ep v="POST" path="/api/v1/rows">
            <p>Create a row. Refs are normalized (<code className="font-mono">zt-100</code> →{" "}
            <code className="font-mono">ZT-100</code>); a duplicate identity card returns 409.</p>
            <Fields
              rows={[
                ["identityRef*", "string", "The card that names the row — ZT for support, OFF/PES for product."],
                ["origin*", '"support" | "product"', "Decides the pipeline family."],
                ["subType", '"bug" | "task"', "Support rows only. Defaults to bug."],
                ["pipelineKey", "string", "Override the default (task → support_light, bug → support_full, product → feature)."],
                ["secondaryRefs", "{ref, url?}[]", "Optional starting pills."],
                ["identityUrl", "string", "Explicit link override; usually unnecessary with link templates."],
              ]}
            />
          </Ep>
          <Ep v="GET" path="/api/v1/rows/{ref}">
            <p>Fetch one row by <b>any</b> ref it carries — identity or secondary. URL-encode{" "}
            <code className="font-mono">#</code>{" "}in PR refs as <code className="font-mono">%23</code>.</p>
          </Ep>
          <Ep v="DELETE" path="/api/v1/rows/{ref}">
            <p>Delete a row and all its state. Rare — prefer completing rows; delete is for mistakes.</p>
          </Ep>
          <Ep v="POST" path="/api/v1/rows/{ref}/refs">
            <p>Add or remove a secondary pill: <code className="font-mono">{`{"action": "add" | "remove", "ref": "panipuri#87", "url?": "…"}`}</code>.
            The identity ref is immutable.</p>
          </Ep>
          <Ep v="GET" path="/api/v1/pipelines">
            <p>The live pipeline definitions — milestone and sub-task keys, labels, and{" "}
            <code className="font-mono">humanUsual</code>{" "}flags. Fetch these; don&apos;t hardcode keys.</p>
          </Ep>

          <H2 id="ep-subtasks">Endpoints · Sub-tasks &amp; regression</H2>
          <p className="max-w-2xl text-sm text-ink-muted">The workhorse. Report a sub-task the moment the underlying action really happened. Omit <code className="font-mono">subtask</code> to bulk-check the whole milestone atomically in one transaction:</p>
          <Ep v="POST" path="/api/v1/rows/{ref}/subtasks">
            <Fields
              rows={[
                ["milestone*", "string", "Milestone key from /api/v1/pipelines."],
                ["subtask", "string", "Sub-task key within that milestone. Omit to atomically check all sub-tasks in the milestone (milestone then completes and bar advances in the same request)."],
                ["checked*", "boolean", "true when it happened; false to record an honest un-happening."],
              ]}
            />
          </Ep>
          <Code>
            {`# Tick a single sub-task\nPOST /api/v1/rows/ZT-4821/subtasks\nAuthorization: Bearer wp_XXXXXXXXXXXX\nIdempotency-Key: pr-panipuri-87\n\n{ "milestone": "development", "subtask": "pr_raised", "checked": true }\n\n# 200 — last sub-task → milestone completes, bar advances\n{ "row": { "identityRef": "ZT-4821", "currentMilestone": "staging", ... } }\n\n\n# Bulk-check all sub-tasks in a milestone (omit "subtask")\nPOST /api/v1/rows/ZT-4821/subtasks\n\n{ "milestone": "development", "checked": true }\n\n# 200 — all sub-tasks + the milestone complete atomically`}
          </Code>
          <Ep v="POST" path="/api/v1/rows/{ref}/regress">
            <p>The one way work moves backwards. <code className="font-mono">{`{"milestone": "development"}`}</code>{" "}
            clears that milestone and every one after it — sub-tasks and completion flags — and the bar
            returns there. Earlier milestones survive. Use it when a shipped fix is rejected; move the
            Jira card back yourself, in Jira.</p>
          </Ep>

          <H2 id="ep-timesheet">Endpoints · Timesheet</H2>
          <Ep v="GET" path="/api/v1/timesheet?months=6">
            <p>Recent months, newest first — each month holds the weeks whose Friday falls in it, with
            per-day state and a <code className="font-mono">submittable</code>{" "}flag.</p>
          </Ep>
          <Ep v="POST" path="/api/v1/timesheet">
            <p><code className="font-mono">{`{"weekId?": "2026-W29", "day": "mon"…"fri", "checked": true}`}</code>{" "}
            — omit <code className="font-mono">weekId</code>{" "}for the current week in your timezone. A day
            tick attests &ldquo;Tempo is logged for that day&rdquo;. 409 once the week is submitted.</p>
          </Ep>
          <Ep v="POST" path="/api/v1/timesheet/{weekId}/submit">
            <p>Submit the week. 409 unless all five days are checked.</p>
          </Ep>
          <Note tone="warn" title="◷ Timezones">
            Timestamps are stored in UTC; day and week bucketing happens in your account&apos;s timezone
            (default <code className="font-mono">Asia/Kolkata</code>). Set it once in Settings or via{" "}
            <code className="font-mono">PATCH /api/v1/me</code>.
          </Note>

          <H2 id="ep-misc">Endpoints · Analytics, me, export</H2>
          <Ep v="GET" path="/api/v1/analytics?from=2026-06-19&to=2026-07-18">
            <p>Throughput per day/week, completed count with delta vs the previous equal-length period,
            origin/sub-type breakdown, loose-end refs, and current WIP. Dates are interpreted in your
            timezone; completion times are last-touch approximations by design.</p>
          </Ep>
          <Ep v="GET" path="/api/v1/me">
            <p>Who am I: user id, auth method, scopes, timezone, link templates.</p>
          </Ep>
          <Ep v="PATCH" path="/api/v1/me">
            <p><code className="font-mono">{`{"timezone?", "jiraBaseUrl?", "githubBaseUrl?"}`}</code> — the link
            templates that turn bare refs into one-click links (<code className="font-mono">PES-1032</code> →{" "}
            <code className="font-mono">{`{jiraBaseUrl}/browse/PES-1032`}</code>).</p>
          </Ep>
          <Ep v="GET" path="/api/v1/export">
            <p>Everything you own as one JSON document — settings, rows with full state, timesheet weeks.
            This is also the privacy-portability mechanism.</p>
          </Ep>

          <H2 id="agents">Automate with agents &amp; llms.txt</H2>
          <p className="max-w-2xl text-sm text-ink-muted">
            The pattern, wherever the agent lives: give it a scoped token as an environment secret,
            point it at <code className="font-mono text-live">/llms.txt</code>, and tell it to mirror
            reality as it works.
          </p>
          <Code>
            {`# a standing instruction for Claude Code (~/.claude/CLAUDE.md)\n"Waypoint tracks my work status. Fetch https://<deployment>/llms.txt\n and follow it: mirror my Jira/GitHub actions into Waypoint as they\n happen. Read the token from $WAYPOINT_TOKEN. Never print it."`}
          </Code>
          <ul className="max-w-2xl list-disc space-y-2 pl-5 text-sm text-ink-muted">
            <li><b className="text-ink">Tick on truth</b> — tie writes to real events (PR opened, CI green, card moved), so the board reflects reality rather than intent.</li>
            <li><b className="text-ink">Respect <code className="font-mono">humanUsual</code></b> — sub-tasks like local testing and deploys are usually done by the human; agents tick them only when told they happened.</li>
            <li><b className="text-ink">Refs only</b> — never card contents, customer data, names, or secrets. There is deliberately nowhere to put them.</li>
          </ul>
          <Note tone="danger" title="✕ Token hygiene for agents">
            Instruct any agent to read the token from the environment and never echo it into logs,
            commits, or its own transcript. If a token is ever printed, revoke it in Settings — it&apos;s
            one click, and the hash at rest means the leak is the only copy.
          </Note>

          <H2 id="security">Security model at a glance</H2>
          <ul className="max-w-2xl list-disc space-y-2 pl-5 text-sm text-ink-muted">
            <li><b className="text-ink">Every query is user-scoped</b> — foreign or unknown refs return 404, never data.</li>
            <li><b className="text-ink">Least-privilege tokens</b> — scoped, hashed at rest, shown once, revocable, rate-limited.</li>
            <li><b className="text-ink">Server-authoritative engine</b> — one module owns completion and regression; clients send facts.</li>
            <li><b className="text-ink">Idempotent writes</b> — retries and replays can&apos;t double-apply.</li>
            <li><b className="text-ink">Strict validation</b> — zod-checked bodies, parameterised queries, unknown keys rejected where they matter.</li>
            <li><b className="text-ink">Session-only blast radius</b> — tokens cannot delete the account or mint other tokens.</li>
            <li><b className="text-ink">Nothing to leak</b> — no free-text fields; the data is card refs, booleans, and timestamps.</li>
          </ul>

          <Note tone="info" title="▣ Where next">
            Back to the <Link href="/" className="text-live hover:underline">overview</Link>, grab the
            agent file at <a href="/llms.txt" className="text-live hover:underline">/llms.txt</a>, or{" "}
            <Link href="/signup" className="text-live hover:underline">create an account</Link> and mint
            your first token in Settings.
          </Note>
        </main>
      </div>
    </div>
  );
}
