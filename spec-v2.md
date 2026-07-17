# Developer Workflow Milestone Tracker — Specification v2

*Status: draft for planning. This supersedes the original handover doc where they conflict — the pipelines in particular are rebuilt around the real workflow rather than the abstract Bug/Task/Feature model.*

---

## 1. Purpose

A personal, single-user-first (multi-user capable) tracker that acts as **external memory** for a developer who now ships far more work because AI does much of the doing. It records **the status and progress of your own work** so you don't hold it in your head.

It is a *status tracker*, not an integration hub.

## 2. Scope and non-goals

**In scope:** logging units of work, moving them through a fixed milestone flow, ticking sub-tasks, a manual timesheet, filtering, date-range inspection, and an analytics view.

**Explicit non-goals** (things this project does **not** do):
- It does **not** integrate with, read from, or store data from Jira, GitHub, Teams, or Tempo. Those actions happen in their own tools — your AI (Claude Code, via its own MCP connections) or you perform them there.
- It stores only **references** to external cards (e.g. the string `ZT-4821`), never their contents.
- No manager review, no approval workflow.
- No full audit trail — history is **last-touch** only (see §5.7).

## 3. Users and accounts

- Each user signs up, logs in, and sees only their own rows.
- Multi-tenant from day one: every row carries a `user_id`; every read and write is scoped to the authenticated user.
- Per-user **timezone** setting, **defaulting to `Asia/Kolkata` (IST, UTC+5:30)**. All timestamps are stored in UTC; the UI and all day/week/month bucketing happen in the user's timezone (this matters for "which weekday" and "which month a week's Friday falls in").

## 4. Core concepts

Two independent row families that share nothing structurally:

1. **Ticket rows** — one row = one unit of work, shown as a single left-to-right progress bar. A row may link **one or more external card references** (e.g. a support `ZT-xxx` plus the cloned `PES-xxx`/`OFF-xxx`).
2. **Timesheet rows** — a manual weekly attestation that time + cards were logged in Tempo. Pinned to the bottom of the dashboard.

---

## 5. Ticket rows

### 5.1 Origin, not "type"

A row has an **origin**, which determines its pipeline:

| Origin | External cards on the row | Pipeline |
| :-- | :-- | :-- |
| **Support** | `ZT-xxx` (support) + cloned `PES-xxx` / `OFF-xxx` (ours) | Support pipeline (§5.2) |
| **Product** | `OFF-xxx` only | Feature pipeline (§5.3) |

A support row also carries a **sub-type label** (`Bug` or `Task`) for filtering and analytics. The label does **not** currently change the pipeline — see Open Question 1.

> **Change from v1:** the original three separate pipelines (Bug / Task / Feature) are replaced by **two pipelines keyed on origin**. Bug vs Task is now a label on Support rows.

*Jira board statuses (the user's actual kanban, which trumps the Confluence-recommended flow): To Do / In Progress / Code Review / Ready for QA / In QA / Done. QA and code review run **in parallel** to save time. No ITSM/JSM (CAB) change-control steps are tracked — that process is being automated away across the repos.*

### 5.2 Support (full) pipeline (single row for `ZT-xxx` + `PES-xxx`/`OFF-xxx`)

Five milestones, each with a sub-task checklist. Per the ZT workflow decision, the ZT card stays open as the master record; a duplicate Bug is created in the team project and linked back.

| # | Milestone | Sub-tasks |
| :-- | :-- | :-- |
| A | **Triage & Setup** | ZT-xxx picked up · classified as Bug · dupe Bug created in team project + linked to ZT (AI) · investment category added |
| B | **Development** | fix implemented · tested locally · branch created · code committed · PR raised |
| C | **Staging** | deployed to staging · staging post in Teams · card to Ready for QA |
| D | **QA & Review** (parallel) | tested on staging · PR reviewed & approved |
| E | **Production & Close-out** | merged to main · deployed to prod · release announcement in Eng Releases · tested on prod · comment on project card (dev/QA language) + moved to Done · comment on ZT (support language) · ZT closed / handed to L2 to close |

### 5.2a Support-light pipeline (`ZT-xxx` only — sub-type Task default)

For support work resolved directly (data fix / DB query / access request) with no branch/PR/deploy. No dupe project card is created for these.

| # | Milestone | Sub-tasks |
| :-- | :-- | :-- |
| A | **Triage & Setup** | ZT picked up · classified as Task · investment category added |
| B | **Resolution** | fix/query prepared · run against DB · result verified · result shared with support |
| C | **Close-out** | comment on ZT (support language) · ZT closed / assigned back |

Pipeline choice defaults from sub-type (Bug → full, Task → light) but is overridable at creation. **Promotion** of a recurring Task to an L2 self-serve endpoint = a new row on the full support pipeline.

### 5.3 Feature pipeline (`OFF-xxx`)

| # | Milestone | Sub-tasks |
| :-- | :-- | :-- |
| A | **Definition** | investment category added · dev/QA estimates added in Jira fields (AI) · acceptance criteria present · moved to In Progress |
| B | **Development** | worked on card · tested locally · branch created · code committed · PR raised · card to Code Review |
| C | **Staging** | deployed to staging · staging post in Teams · card to Ready for QA |
| D | **QA & Review** (parallel) | tested on staging (In QA) · PR reviewed & approved |
| E | **Production & Close** | merged to main · deployed to prod · release announcement in Eng Releases · card moved to Done |

### 5.4 Completion, auto-advance, and sub-task rules

- **All sub-tasks are mandatory.** A milestone is complete when all its sub-tasks are checked, at which point the bar auto-advances to the next milestone.
- Some sub-tasks (local testing, staging/prod testing, deployment) are things **AI cannot do** — the user ticks them from the UI, or tells the AI they're done so it can tick them. This is a soft note per sub-task ("usually done by you"), not an enforced restriction.
- **Progress logic is computed in one place (server-side)** so the dashboard UI and the API can never disagree about where a bar is. This is about consistency, not policing — the API is just you acting programmatically on your own data.
- **Unchecking a *sub-task* does not move the bar.** A completed milestone stays complete. But see the loose-ends rule in §5.6.

### 5.5 Regression (a shipped fix is rejected)

The one case where work goes backwards. When the support reporter rejects the fix:
- The user **unchecks a milestone**, which regresses the bar to that milestone.
- **Confirmed rule:** unchecking milestone X clears **all sub-tasks and completion flags of X and every milestone after it** (required by auto-advance: a re-opened milestone with all sub-tasks still checked would instantly complete again). Milestones before X stay done. The target is the user's choice — a rejected fix typically means unchecking Development (B); a bounced CR means unchecking Staging (C) only.
- The linked project card status is moved back to in-progress **by you/the AI in Jira**, not by this tracker.

### 5.6 "Complete but loose ends" visibility

If a row is complete **but has any unchecked sub-task**, it stays visible on the dashboard **even when the global filter is set to hide completed rows** — a nudge so nothing technically-done slips away with a loose thread.

### 5.7 Support → Feature pivot (rare)

When a support card turns out to be a feature: you notify support it's a feature, take direction from product, and stop reporting to support for that card.

**Confirmed handling: close + new row** (same rule as Promotion). The support row completes through its Close-out milestone; a fresh Feature row starts for the product work, linking the new OFF card and optionally the original ZT ref for traceability. **No row ever changes pipeline or origin after creation** — no pipeline-switch machinery, no archived milestone states. Cost accepted: analytics see two rows instead of one long journey for this rare event.

### 5.8 Timestamps

- Every milestone and sub-task entry stores `created_at` and `updated_at` in UTC (`YYYY-MM-DDTHH:mm:ssZ`).
- Behaviour is **last-touch**: `updated_at` reflects the most recent change only. Keeping `created_at` on each event object leaves the door open to a richer history later without changing the model now.
- UI shows the latest timestamp on hover/expand.

---

## 6. Timesheet rows (manual only)

- **No Tempo integration.** A day checkmark is a self-attestation that you logged time + cards in Tempo that day (you do the actual logging in Atlassian / the auto-tempo repo — out of scope here).
- Hierarchy: **Month → Weeks → Days (Mon–Fri) + Submit marker.**
- Storage: **one object per ISO week** (`week_id: "2026-W29"`) holding five day-checkmarks + a submit record (`status`, `submitted_at`). Every toggle stores a UTC timestamp.
- **Month view is derived, not stored:** query weeks whose Friday falls in the target month (in the user's timezone).
- **Weekly submit** unlocks only once all five days are checked. Rendered as a distinct marker between Friday and the following Monday.
- PTO/holidays are ticked the same as work days — no separate state.
- Layout: sticky to the bottom of the dashboard, container shows **max 2 month-rows**, older rows scroll within it.

---

## 7. Global filter — show/hide completed

- Single toggle over both row families. **Default: OFF** (completed hidden).
- Completed = ticket row's final milestone complete; timesheet month row = all its weeks submitted.
- **Exception:** completed ticket rows with an unchecked sub-task stay visible (§5.6).

---

## 8. Date-range inspection mode

- Off by default. Selecting a range:
  - Puts the tracker in **read-only**.
  - Forces the filter **ON** and disables it.
  - **Row visibility:** a row shows if any entry's `updated_at` falls in the range.
  - **Graying:** within a shown row, milestones/days whose own `updated_at` is outside the range are grayed.
- On dismiss: back to editable, filter reverts to its prior state and re-enables.
- **Known limit (last-touch):** because only the latest change is stored, the range answers "was this entry's *most recent* change in the window," not "did anything happen in the window." Good enough for now; the `created_at` groundwork (§5.8) is the upgrade path if this ever needs to be exact.

---

## 9. Analytics page (new)

A page that, for a selected date range, shows whether you sped up or slowed down and what you got done. Every metric supports a **comparison to the previous equal-length period** so trends read as "+18% vs last month."

Proposed metrics and visuals:

| Metric | Visual | Note |
| :-- | :-- | :-- |
| Cards completed over time | line / bar by day or week | the headline throughput number |
| Velocity change | big number with delta | this range vs previous |
| Cycle time (created → done) | line + distribution | median and average |
| Time per milestone (bottlenecks) | horizontal bar | approximate under last-touch |
| Work in progress over time | area / line | how much you're juggling |
| Breakdown by origin & sub-type | donut / stacked bar | support vs product; bug vs task |
| Regression rate | number / small line | how often fixes bounced back (quality signal) |
| Loose-ends count | number | complete rows with unchecked sub-tasks |
| Timesheet compliance | calendar heatmap | weekdays filled, weeks submitted |

**Build order (decided):** first wave = cards completed over time (bar by week), velocity delta vs previous period, breakdown by origin & sub-type, loose-ends count (click-through to rows). Second wave (later) = cycle time, time-per-milestone, WIP over time, regression rate, timesheet heatmap.

---

## 10. API (optional, for AI/automation)

Purely a programmatic mirror of what you can do in the dashboard, **authenticated as you**. Manual users never need it.

- **Auth:** the human uses a session cookie in the browser; scripts/agents use a **scoped personal access token** (bearer, hashed at rest, shown once, revocable).
- **Actions:** create a row, check/uncheck sub-tasks, advance/regress milestones, add card references, tick timesheet days, submit a week, and read rows for analytics.
- **Idempotency:** writes accept an `Idempotency-Key` header so a re-run job or retried call never double-applies.
- **No external data:** the API never touches Jira/GitHub/Teams; the AI already has its own MCP connections for that.
- The detailed endpoint draft lives in the separate `docs.html` page.
- **AI instruction file (decided):** one canonical `AGENTS.md` at the repo root, served verbatim by the deployed app at `/llms.txt` so any agent can fetch current instructions alongside the API. Covers: status-mirror purpose, PAT auth, lookup by card ref, row-creation rules per pipeline, tick-as-you-go, human-usually-done sub-tasks (tick only when told), regression, timesheet, idempotency, and the hard rule: refs only — never card contents, customer data, or credentials.

---

## 11. Data model sketch

- **user**: id, email, password_hash, timezone (default `Asia/Kolkata`), created_at. *(No `name` — data minimization.)*
- **api_token**: id, user_id, token_hash, scopes, created_at, last_used_at, revoked_at.
- **ticket_row**: id, user_id, origin (`support`|`product`), sub_type (`bug`|`task`|null), pipeline_key (`support_full`|`support_light`|`feature`), external_refs (unbounded list of `{kind: jira|github_pr|other, ref, url?}`), current_milestone, is_complete, created_at, updated_at.
- **Identity card (mandatory, unique per user):** every row is identified by exactly one card ref — the **ZT card** for support rows (source of truth), the **OFF/PES card** for product rows. Creating a second row with the same identity card is rejected; it's also the AI's natural lookup key. All other refs (the dupe PES/OFF card on a support row, PRs, a pivot's back-reference) are **secondary pills**: optional, and allowed to repeat across rows. Rows have no title — the pills are the row's name.
- **Link templates** (per-user settings): a Jira base URL and one URL pattern per GitHub org, so a bare ref like `PES-1032` or `panipuri#4821` auto-derives its clickable URL. An explicit `url` on a ref overrides the template; with neither, the chip renders as plain text. Links are always optional — never required, never blocking.
- **milestone_state** (per row, config-driven from the pipeline definition): milestone_key, complete (bool), created_at, updated_at.
- **subtask_state**: milestone_key, subtask_key, checked (bool), created_at, updated_at.
- **pipeline_definitions**: the two pipelines held as **config/data, not code**, so milestones and sub-tasks can be edited without a deploy.
- **timesheet_week**: id, user_id, week_id (`YYYY-Www`), days `{mon..fri: {checked, updated_at}}`, submit `{status, submitted_at}`, created_at, updated_at.

---

## 12. Tech stack (decided — see ADR-0001)

- **Next.js (App Router) + TypeScript** on **Vercel** — UI and the programmatic API (`/api/*` route handlers) in one deployable.
- **PostgreSQL on Neon** (Singapore region — stated on the privacy page) with **Drizzle ORM** (typed, parameterised queries) and JSONB for the per-ISO-week timesheet objects.
- **Better Auth** — email+password sessions (`HttpOnly`/`Secure`/`SameSite` cookies, CSRF built in); its API-key plugin as the basis for scoped personal access tokens.
- **Tailwind, Zod (shared schemas), TanStack Query.** Dropped: Storybook, XState, React Router (Next routing), Vite, Fastify/NestJS, Lucia (deprecated 2025).

---

## 13. Security and privacy

Because the API acts only on the user's own data with the user's own token, the threat model is modest, but the basics still hold:
- Every read/write scoped to the authenticated user (broken access control is the main risk to avoid).
- Parameterised queries and strict input validation on every field.
- Tokens hashed at rest, shown once, scoped, revocable; never logged, never in client code.
- Session cookies `HttpOnly` + `Secure` + `SameSite`, with CSRF protection on state-changing requests.

**Privacy — acknowledged 2026-07-18.** Launch from India, users worldwide → DPDP Act 2023 + (for EU/UK/US users) GDPR/UK GDPR/US state laws in scope. The user explicitly accepted processing this personal data globally, with the **data-minimization package**:
1. Collect only **email + password hash + timezone** — no `name` field; display name = email prefix.
2. **Self-serve hard delete**: account deletion cascades every row immediately (satisfies erasure rights everywhere).
3. **Self-serve JSON export** (portability).
4. **No analytics trackers, no third-party cookies** — session cookie only, no consent banner needed.
5. **Privacy page** stating what's stored, where hosted, and the self-serve delete/export.
6. **Minimal log retention** — platform-default short-lived logs; no IPs persisted into app tables.

**Confidentiality by design:** ticket rows have **no title / free-text field** — a row is identified solely by its external card refs (e.g. `PES-11929`). Xplor-confidential or customer content structurally cannot be stored. The AI instruction file must still tell agents to never paste card contents, customer data, or credentials into Waypoint.

---

## 14. Decisions log

**Resolved from your answers:**
- Multi-user, each user sees own data; API mirrors dashboard actions, authenticated as the user.
- History is last-touch; `created_at` kept on event objects for a future upgrade.
- Single row links both the support card and the cloned project card.
- Timesheet is fully manual; **no Tempo integration** — both original open decisions (manual-vs-sync conflict; ticket editable-mode toggle) are therefore dissolved.
- Unchecking a sub-task doesn't move the bar; regression is done by unchecking a milestone.
- Completed rows with an unchecked sub-task stay visible under the hide-completed filter.
- Timezone defaults to IST, stored UTC.
- Real-time updates: nice-to-have, not required.

**Resolved in grilling session (2026-07-17):**
- Project name: **Waypoint**.
- Support **Task** gets a third pipeline, **Support-light**: Triage & Setup (ZT picked up · classified · investment category) → Resolution (fix/query prepared · run against DB · result verified · result shared with support) → Close-out (comment on ZT · ZT closed/assigned back). No project card sub-task — per Confluence, ZT Tasks are actioned directly without a dupe Bug. Default: sub-type Task → light, Bug → full; overridable at creation.
- **Promotion** of a recurring Task to an L2 self-serve endpoint = a **new row** on the full support pipeline (matches team practice: endpoint gets its own OFF card, e.g. OFF-13090 under epic OFF-12077). The light row remains as the record of interim query-running.

**Still open:**
2. Are the 5-milestone groupings in §5.2 / §5.3 the right checkpoint boundaries, or would you split/merge any?
3. ~~Regression scope~~ — resolved: uncheck any milestone; it and everything after it clear fully (§5.5).
4. ~~Support→Feature pivot~~ — resolved: close + new row; pipelines are immutable after creation (§5.7).
5. ~~Max external references~~ — resolved: unbounded list; PRs are refs too, with optional links via per-user link templates (§11).
6. ~~Analytics priority~~ — resolved: first wave = throughput, velocity delta, origin/sub-type breakdown, loose-ends count (§9).
