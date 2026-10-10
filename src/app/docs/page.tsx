import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DocsSidebar } from "@/components/docs-sidebar";
import { Chip } from "@/components/chip";
import { AlertIcon, BookIcon, CheckCircleIcon, InfoIcon, SparkleIcon, type IconProps } from "@/components/icons";
import { LogoTile } from "@/components/logo";
import { btnGhost, btnPill, btnPrimary, btnSecondary } from "@/components/ui";

export const metadata = {
  title: "Waypoint API — docs",
  description: "Automate your Waypoint tracker with any AI: authentication, data model, and every endpoint.",
};

/* ---------- tiny presentational helpers ---------- */

type Method = "GET" | "POST" | "PATCH" | "DELETE";

/** The colours of each HTTP method pill. Three use pastel tones of the Chip component. PATCH uses the accent. */
const VERB_TONE: Record<Method, string> = {
  GET: "bg-chip-mint text-chip-ink",
  POST: "bg-chip-yellow text-chip-ink",
  PATCH: "bg-accent text-accent-ink",
  DELETE: "bg-chip-salmon text-chip-ink",
};

function Verb({ v }: { v: Method }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 font-mono text-[11px] font-bold leading-none tracking-wide ${VERB_TONE[v]}`}
    >
      {v}
    </span>
  );
}

/** Inline code. It is a small well with a mono font. `accent` gives it the accent colour. */
function C({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <code
      className={`rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[12.5px] ring-1 ring-edge ${
        accent ? "text-accent-fg" : "text-ink"
      }`}
    >
      {children}
    </code>
  );
}

/** A paragraph of body text. */
function P({ children }: { children: ReactNode }) {
  return <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">{children}</p>;
}

function Ep({ v, path, children }: { v: Method; path: string; children?: ReactNode }) {
  return (
    <div className="my-4 max-w-3xl overflow-hidden rounded-2xl bg-surface ring-1 ring-edge/70">
      <div
        className={`flex flex-wrap items-center gap-3 px-4 py-3 font-mono text-[13px] text-ink ${
          children ? "border-b border-edge/60" : ""
        }`}
      >
        <Verb v={v} />
        <span className="min-w-0 break-all">{path}</span>
      </div>
      {children && (
        <div className="px-4 pb-4 pt-3.5 text-sm leading-relaxed text-ink-muted [&_p]:mb-2 [&_p:last-child]:mb-0">{children}</div>
      )}
    </div>
  );
}

type NoteTone = "info" | "good" | "warn" | "danger";

/** The box colour, the icon tile colour and the icon of each note tone. */
const NOTE_TONE: Record<NoteTone, { box: string; tile: string; Icon: ComponentType<IconProps> }> = {
  info: { box: "bg-surface ring-1 ring-edge/70", tile: "bg-surface-2 text-accent-fg", Icon: InfoIcon },
  good: { box: "bg-done/10 ring-1 ring-done/25", tile: "bg-done/15 text-done", Icon: CheckCircleIcon },
  warn: { box: "bg-warn/10 ring-1 ring-warn/25", tile: "bg-warn/15 text-warn", Icon: AlertIcon },
  danger: { box: "bg-danger/10 ring-1 ring-danger/25", tile: "bg-danger/15 text-danger", Icon: AlertIcon },
};

function Note({ tone, title, children }: { tone: NoteTone; title: string; children: ReactNode }) {
  const { box, tile, Icon } = NOTE_TONE[tone];
  return (
    <div role="note" className={`my-5 flex max-w-3xl gap-3.5 rounded-2xl p-4 text-sm ${box}`}>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tile}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="mb-1 text-[13.5px] font-semibold text-ink">{title}</p>
        <div className="leading-relaxed text-ink-muted">{children}</div>
      </div>
    </div>
  );
}

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mb-3 mt-14 scroll-mt-24 font-serif text-2xl font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <pre className="my-4 max-w-3xl overflow-x-auto rounded-2xl bg-surface p-4 font-mono text-[13px] leading-relaxed text-ink ring-1 ring-edge/70">
      {children}
    </pre>
  );
}

function Fields({ rows }: { rows: [string, string, string][] }) {
  return (
    // The wrapper clips the header row to the round corners. It scrolls on a narrow screen.
    <div className="my-3 max-w-3xl overflow-x-auto rounded-2xl ring-1 ring-edge">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-surface-2">
            {["Field", "Type", "Notes"].map((h) => (
              <th
                key={h}
                className="px-3.5 py-2.5 text-left font-mono text-[10.5px] font-medium uppercase tracking-wider text-ink-faint"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([f, t, n]) => (
            <tr key={f} className="border-t border-edge/60">
              <td className="whitespace-nowrap px-3.5 py-2.5 align-top font-mono text-ink">{f}</td>
              <td className="px-3.5 py-2.5 align-top text-ink-muted">{t}</td>
              <td className="px-3.5 py-2.5 align-top text-ink-muted">{n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      { id: "ep-integrations", label: "Integrations" },
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

export default async function DocsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="min-h-screen bg-desk">
      {/*
        The header band is a strip of desk colour. It hides the page that scrolls behind the bar.
        It sticks to the top from the sm width. On a narrow screen it does not stick, and the bar can have two rows.
        The band is 80px high when the bar has one row.
        If you change this height, change the sidebar offset and the anchor offset too.
      */}
      <div className="bg-desk px-2.5 pb-3 pt-2.5 sm:sticky sm:top-0 sm:z-40 sm:px-3 sm:pt-3">
        <header className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl bg-bg py-2 pl-3 pr-2">
          <Link href="/" className="flex items-center gap-2.5 text-ink">
            <LogoTile className="h-9 w-9" />
            <span className="font-serif text-lg font-semibold tracking-tight">Waypoint</span>
          </Link>
          <nav aria-label="Site" className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Link href="/llms.txt" className={btnPill}>
              <SparkleIcon className="h-3.5 w-3.5 text-accent-fg" />
              llms.txt
            </Link>
            <span className="hidden sm:inline-flex">
              <Chip tone="ghost" className="select-none font-mono">
                API v1
              </Chip>
            </span>
            {session ? (
              <Link href="/board" className={btnSecondary}>
                Board
              </Link>
            ) : (
              <>
                <Link href="/login" className={btnGhost}>
                  Sign in
                </Link>
                <Link href="/signup" className={btnPrimary}>
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </header>
      </div>

      <div className="px-2.5 sm:px-3">
        <div className="mx-auto flex max-w-6xl gap-10 rounded-panel bg-bg px-5 sm:px-8">
          <DocsSidebar groups={NAV} />

          <main className="min-w-0 flex-1 pb-12 pt-8">
            <p className="mb-4 flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-fg">
              <BookIcon className="h-3.5 w-3.5" />
              Integration guide
            </p>
            <h1 className="font-serif text-[32px] font-semibold leading-tight tracking-tight sm:text-[40px]">
              Automate your tracker with any AI.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-[17px]">
              Everything the Waypoint board does is a small REST API — the board itself is just
              another client. Give an agent a token and it can create rows, tick sub-tasks, regress a
              bounced fix, and attest your timesheet, all as you.
            </p>

            <H2 id="overview">Overview</H2>
            <P>
              Waypoint is a <b className="text-ink">status mirror</b>, not an integration hub. It never
              reads from or writes to Jira, GitHub, or Teams — your AI already has its own connections
              to those. The contract: do the real work there, then report what happened here. Progress
              logic (completion, auto-advance, regression) is computed server-side in one engine, so
              the API and the UI can never disagree.
            </P>
            <Note tone="info" title="For agents, there's a shortcut">
              The live instruction file at <C accent>/llms.txt</C>{" "}teaches an AI
              when to create rows, which pipeline to pick, what to tick, and what never to write. Most
              integrations are one line: &ldquo;fetch the llms.txt and follow it.&rdquo; This page is the
              human-readable superset.
            </Note>

            <H2 id="auth">Authentication</H2>
            <P>
              Two audiences, two mechanisms. A person in a browser uses the session cookie
              (HttpOnly, Secure, SameSite, CSRF-protected — handled by the app). Machines use a{" "}
              <b className="text-ink">personal access token</b> created in Settings: shown once, stored
              only as a hash, revocable instantly, scoped <C>read</C>{" "}or{" "}
              <C>read,write</C>.
            </P>
            <Code>
              {`# either header works\nAuthorization: Bearer wp_XXXXXXXXXXXX\nx-api-key: wp_XXXXXXXXXXXX`}
            </Code>
            <Note tone="good" title="Least privilege">
              Mint the narrowest token the job needs — a reporting script gets <C>read</C>,
              nothing more. Inject tokens as environment secrets; never in client code, prompts, or repos.
            </Note>
            <Note tone="danger" title="Session-only actions">
              Token management and account deletion are deliberately <b>not</b> available to tokens — a
              leaked PAT can move your bars, but it can&apos;t destroy your account or mint new keys.
            </Note>

            <H2 id="base">Base URL &amp; versioning</H2>
            <Code>{`https://waypoint-bd.vercel.app/api/v1`}</Code>
            <P>
              The API lives on the same host as the app; the version is in the path. Additive fields may
              appear within <C>v1</C> — parse defensively and ignore unknown keys.
            </P>

            <H2 id="model">Data model</H2>
            <ul className="max-w-2xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-muted marker:text-ink-faint">
              <li>
                <b className="text-ink">Row</b> — one unit of work. Identified by its{" "}
                <b className="text-ink">identity card ref</b> (the ZT card for support work, the OFF/PES
                card for product work), unique per user. Rows have <b className="text-ink">no title</b>;
                secondary refs (dupe card, PRs) ride along as pills and may repeat across rows.
              </li>
              <li>
                <b className="text-ink">Pipeline</b> — <C>support_full</C>,{" "}
                <C>support_light</C>, or <C>feature</C>,
                chosen at creation (default: support bug → full, support task → light) and{" "}
                <b className="text-ink">immutable</b> afterwards. Pivots and promotions are new rows.
              </li>
              <li>
                <b className="text-ink">Milestones &amp; sub-tasks</b> — every sub-task is mandatory; a
                milestone completes when all are checked, and the bar auto-advances. Unchecking a
                sub-task on a completed row does <em className="font-semibold not-italic text-ink">not</em> move the bar — it creates a{" "}
                <b className="text-ink">loose end</b>.
              </li>
              <li>
                <b className="text-ink">Timesheet week</b> — one object per ISO week
                (<C>2026-W29</C>): five day-attestations plus a submit record.
                Months are derived from each week&apos;s Friday in your timezone; you never write a &ldquo;month&rdquo;.
              </li>
            </ul>
            <Note tone="info" title="Server-authoritative">
              Callers submit facts (&ldquo;this sub-task happened&rdquo;), never state (&ldquo;the bar is at
              80%&rdquo;). Completion, advancement, and user-scoping are computed server-side; an agent
              cannot forge a bar forward or touch rows that aren&apos;t yours.
            </Note>

            <H2 id="idempotency">Idempotency</H2>
            <P>
              Send an <C>Idempotency-Key</C>{" "}header (a CI run id, a UUID) on any
              write. The first successful result is stored per user+key and replayed for repeats, with
              the response header <C>Idempotency-Replayed: true</C>. Errors are
              not stored, so a failed call may be retried with the same key.
            </P>
            <Code>{`Idempotency-Key: ci-run-8837f2`}</Code>

            <H2 id="errors">Errors &amp; limits</H2>
            <P>
              Errors are <C>{`{ "error": "human-readable message" }`}</C>{" "}with a
              conventional status. Validation messages name the offending field.
            </P>
            <Fields
              rows={[
                ["400", "invalid request", "Malformed JSON, unknown milestone/sub-task key, bad enum, invalid week id."],
                ["401", "unauthenticated", "Missing, invalid, or revoked token; no session."],
                ["403", "forbidden", "Token lacks the write scope, or a session-only action (account deletion) was attempted with a token."],
                ["404", "not found", "No row carries that ref — also what you see for another user's rows; existence never leaks."],
                ["409", "conflict", "Duplicate identity card, submitting an incomplete week, ticking a day on a submitted week."],
              ]}
            />
            <P>
              Tokens are rate-limited to <b className="text-ink">240 requests/minute</b>. On 429, back off
              and retry; writes carrying an idempotency key are always safe to retry.
            </P>

            <H2 id="ep-rows">Endpoints · Rows</H2>
            <Ep v="GET" path="/api/v1/rows">
              <p>List every row you own, with full milestone/sub-task state and resolved link URLs. The
              API always returns everything, completed rows included; the Board hides completed rows on the client.</p>
            </Ep>
            <Ep v="POST" path="/api/v1/rows">
              <p>Create a row. Refs are normalized (<C>zt-100</C> →{" "}
              <C>ZT-100</C>); a duplicate identity card returns 409.</p>
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
              <C>#</C>{" "}in PR refs as <C>%23</C>.</p>
            </Ep>
            <Ep v="DELETE" path="/api/v1/rows/{ref}">
              <p>Delete a row and all its state. Rare — prefer completing rows; delete is for mistakes.</p>
            </Ep>
            <Ep v="POST" path="/api/v1/rows/{ref}/refs">
              <p>Add or remove a secondary pill: <C>{`{"action": "add" | "remove", "ref": "panipuri#87", "url?": "…"}`}</C>.
              The identity ref is immutable.</p>
            </Ep>
            <Ep v="GET" path="/api/v1/pipelines">
              <p>The live pipeline definitions — milestone and sub-task keys and labels. Fetch these; don&apos;t hardcode keys.</p>
            </Ep>
            <Ep v="POST" path="/api/v1/rows/{ref}/complete">
              <p>Fast-complete a row — checks every remaining sub-task across all milestones in one
              transaction, advancing the bar to done. Useful when a piece of work shipped outside the
              normal milestone flow and you want to close it out cleanly.</p>
            </Ep>
            <Ep v="POST" path="/api/v1/rows/{ref}/wontfix">
              <p>Close a row as won&apos;t-fix — marks it complete without checking any remaining sub-tasks.
              The row is done, but the unchecked items stay unchecked as an honest record that those
              steps were skipped.</p>
            </Ep>

            <H2 id="ep-subtasks">Endpoints · Sub-tasks &amp; regression</H2>
            <P>The workhorse. Report a sub-task the moment the underlying action really happened. Omit <C>subtask</C> to bulk-check the whole milestone atomically in one transaction:</P>
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
              <p>The one way work moves backwards. <C>{`{"milestone": "development"}`}</C>{" "}
              clears that milestone and every one after it — sub-tasks and completion flags — and the bar
              returns there. Earlier milestones survive. Use it when a shipped fix is rejected; move the
              Jira card back yourself, in Jira.</p>
            </Ep>

            <H2 id="ep-timesheet">Endpoints · Timesheet</H2>
            <Ep v="GET" path="/api/v1/timesheet?months=6">
              <p>Recent months, newest first — each month holds the weeks whose Friday falls in it, with
              per-day state and a <C>submittable</C>{" "}flag.</p>
            </Ep>
            <Ep v="POST" path="/api/v1/timesheet">
              <p><C>{`{"weekId?": "2026-W29", "day": "mon"…"fri", "checked": true}`}</C>{" "}
              — omit <C>weekId</C>{" "}for the current week in your timezone. A day
              tick attests &ldquo;Tempo is logged for that day&rdquo;. 409 once the week is submitted.</p>
            </Ep>
            <Ep v="POST" path="/api/v1/timesheet/{weekId}/submit">
              <p>Submit the week. 409 unless all five days are checked.</p>
            </Ep>
            <Ep v="POST" path="/api/v1/timesheet/{weekId}/unsubmit">
              <p>Reopen a previously submitted week so days can be changed. The week returns to
              the &ldquo;checked but not submitted&rdquo; state.</p>
            </Ep>
            <Ep v="POST" path="/api/v1/timesheet/autotempo">
              <p>Auto-log Tempo days based on the user&apos;s configured auto-tempo rules. Optionally
              pass specific dates to process; omit to use the default date range.</p>
              <Fields
                rows={[
                  ["dates", "string[]", "Optional array of YYYY-MM-DD date strings to process. Omit for the default range."],
                ]}
              />
            </Ep>
            <Note tone="warn" title="Timezones">
              Timestamps are stored in UTC; day and week bucketing happens in your account&apos;s timezone
              (default <C>Asia/Kolkata</C>). Set it once in Settings or via{" "}
              <C>PATCH /api/v1/me</C>.
            </Note>

            <H2 id="ep-misc">Endpoints · Analytics, me, export</H2>
            <Ep v="GET" path="/api/v1/analytics?from=2026-06-19&to=2026-07-18">
              <p>Throughput per day/week, completed count with delta vs the previous equal-length period,
              origin/sub-type breakdown, loose-end refs, and current WIP. Dates are interpreted in your
              timezone; completion times are last-touch approximations by design.</p>
            </Ep>
            <Ep v="GET" path="/api/v1/me">
              <p>Who am I: user id, auth method, scopes, timezone, link templates. Secrets are never returned —
              only flags such as <C>hasJiraApiToken</C> and <C>hasGithubPat</C>.</p>
            </Ep>
            <Ep v="PATCH" path="/api/v1/me">
              <p>Update user settings. All fields are optional — send only what you want to change.
              Secret fields are write-only: omit one or send <C>&quot;&quot;</C> to keep it,
              send a string to replace it, send <C>null</C> to clear it.
              Link templates turn bare refs into one-click links (<C>PES-1032</C> →{" "}
              <C>{`{jiraBaseUrl}/browse/PES-1032`}</C>).</p>
              <Fields
                rows={[
                  ["timezone", "string", "IANA timezone (e.g. Asia/Kolkata)."],
                  ["jiraBaseUrl", "string | null", "Jira instance URL for link templates."],
                  ["jiraEmail", "string | null", "Jira account email for API access."],
                  ["jiraApiToken", "string | null", "Jira API token (write-only)."],
                  ["jiraAccountId", "string | null", "Jira account ID (for Tempo)."],
                  ["githubBaseUrl", "string | null", "GitHub instance URL."],
                  ["githubPat", "string | null", "GitHub personal access token for PR status sync (write-only)."],
                  ["githubDefaultOrg", "string | null", "Default GitHub org for short-form PR refs (repo#123)."],
                  ["tempoApiToken", "string | null", "Tempo API token for auto-tempo (write-only)."],
                  ["colorTheme", '"lime" | "paper" | "nord" | "royal"', "App colour theme."],
                  ["fontTheme", '"serif" | "sans" | "mono"', "App font family."],
                  ["showTimesheet", "boolean", "Show or hide the timesheet sidebar."],
                  ["autoTempoDefaultRule", "object | null", "Default auto-tempo logging rule."],
                  ["autoTempoSkipDays", "string[] | null", "Days to skip during auto-tempo (e.g. public holidays)."],
                  ["autoTempoRules", "object[] | null", "Per-project auto-tempo rule overrides."],
                  ["autoTempoScheduled", "boolean", "Opt in to the weekly auto-tempo run every Friday at 12:30 UTC."],
                ]}
              />
            </Ep>
            <Ep v="GET" path="/api/v1/export">
              <p>Everything you own as one JSON document — settings, rows with full state, timesheet weeks.
              This is also the privacy-portability mechanism.</p>
            </Ep>
            <Ep v="DELETE" path="/api/v1/account">
              <p>Permanently delete your account and all associated data. This is a privacy self-serve
              erasure endpoint. <b>Session-only</b> — tokens cannot perform this action (403).</p>
              <Fields
                rows={[
                  ["confirm*", '"DELETE"', "Safety latch — must be the literal string DELETE."],
                ]}
              />
            </Ep>

            <H2 id="ep-integrations">Endpoints · Integrations</H2>
            <Ep v="POST" path="/api/v1/integrations/sync">
              <p>Pull the latest statuses from Jira and GitHub for every active row you own. Jira issue
              statuses are cached and, where possible, matching sub-tasks are auto-advanced (e.g. a card
              moving to &ldquo;Code Review&rdquo; ticks <C>card_code_review</C>).
              GitHub PR state, mergeable status, and review decision are synced similarly.</p>
              <p>No request body. Requires Jira/GitHub credentials configured via{" "}
              <C>PATCH /api/v1/me</C>.</p>
            </Ep>
            <Note tone="info" title="Integration credentials">
              Configure Jira and GitHub credentials in Settings or via <C>PATCH /api/v1/me</C>{" "}
              before calling sync. The sync endpoint reads your stored credentials and fans out requests
              across all active rows.
            </Note>

            <H2 id="agents">Automate with agents &amp; llms.txt</H2>
            <P>
              The pattern, wherever the agent lives: give it a scoped token as an environment secret,
              point it at <C accent>/llms.txt</C>, and tell it to mirror
              reality as it works.
            </P>
            <Code>
              {`# a standing instruction for Claude Code (~/.claude/CLAUDE.md)\n"Waypoint tracks my work status. Fetch https://<deployment>/llms.txt\n and follow it: mirror my Jira/GitHub actions into Waypoint as they\n happen. Read the token from $WAYPOINT_TOKEN. Never print it."`}
            </Code>
            <ul className="max-w-2xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-muted marker:text-ink-faint">
              <li><b className="text-ink">Tick on truth</b> — tie writes to real events (PR opened, CI green, card moved), so the board reflects reality rather than intent.</li>
              <li><b className="text-ink">Refs only</b> — never card contents, customer data, names, or secrets. There is deliberately nowhere to put them.</li>
            </ul>
            <Note tone="danger" title="Token hygiene for agents">
              Instruct any agent to read the token from the environment and never echo it into logs,
              commits, or its own transcript. If a token is ever printed, revoke it in Settings — it&apos;s
              one click, and the hash at rest means the leak is the only copy.
            </Note>

            <H2 id="security">Security model at a glance</H2>
            <ul className="max-w-2xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-muted marker:text-ink-faint">
              <li><b className="text-ink">Every query is user-scoped</b> — foreign or unknown refs return 404, never data.</li>
              <li><b className="text-ink">Least-privilege tokens</b> — scoped, hashed at rest, shown once, revocable, rate-limited.</li>
              <li><b className="text-ink">Server-authoritative engine</b> — one module owns completion and regression; clients send facts.</li>
              <li><b className="text-ink">Idempotent writes</b> — retries and replays can&apos;t double-apply.</li>
              <li><b className="text-ink">Strict validation</b> — zod-checked bodies, parameterised queries, unknown keys rejected where they matter.</li>
              <li><b className="text-ink">Session-only blast radius</b> — tokens cannot delete the account or mint other tokens.</li>
              <li><b className="text-ink">Nothing to leak</b> — no free-text fields; the data is card refs, booleans, and timestamps.</li>
            </ul>

            <Note tone="info" title="Where next">
              Back to the <Link href="/" className="font-medium underline-offset-2 hover:underline">overview</Link>, grab the
              agent file at <a href="/llms.txt" className="font-medium underline-offset-2 hover:underline">/llms.txt</a>, or{" "}
              <Link href="/signup" className="font-medium underline-offset-2 hover:underline">create an account</Link> and mint
              your first token in Settings.
            </Note>
          </main>
        </div>
      </div>

      {/*
        Empty room below the panel. The last sections need it to scroll high enough
        to become the current item in the sidebar. The sidebar shows from the md width.
      */}
      <div aria-hidden="true" className="hidden h-[45vh] md:block" />
    </div>
  );
}
