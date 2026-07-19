# Waypoint — instructions for AI agents

Waypoint is a personal **status tracker** that acts as external memory for a
developer's work. You (the AI) do real work in Jira, GitHub, and Teams through
your own connections — and then **mirror the status of that work into
Waypoint**. Waypoint never touches those tools itself.

This file is served live at `/llms.txt` on the deployed app. The API base is
`/api/v1` on the same host.

## What Waypoint is (and is not)

- One **row** = one unit of work, moving left-to-right through a fixed
  **pipeline** of **milestones**, each with a mandatory **sub-task** checklist.
  A milestone completes when all its sub-tasks are checked; the bar
  auto-advances. Progress logic is computed server-side — you never decide
  what's "complete," you just report which sub-tasks happened.
- It stores **card references only** (`ZT-4821`, `PES-11929`, `panipuri#123`)
  — never card contents.
- **Timesheet**: a weekly attestation that time + cards were logged in Tempo.
  Checking a day means "Tempo logging for that day is done."

## Hard rules

1. **Never write card contents, customer data, names, credentials, or secrets
   into Waypoint.** Refs only. There is deliberately no title or free-text
   field — do not try to smuggle descriptions into ref strings.
2. **Never tick a sub-task that didn't actually happen.** Waypoint is the
   user's memory; a false tick is a corrupted memory.
3. Sub-tasks marked `humanUsual` (local testing, staging/prod testing,
   deploys) are usually done by the human. Tick them **only when the user
   explicitly tells you they're done.**
4. Use an `Idempotency-Key` header on writes you might retry.

## Authentication

Send a personal access token (created by the user in Settings) as either:

```
Authorization: Bearer wp_XXXX
x-api-key: wp_XXXX
```

Tokens are scoped `read` or `read,write`. Account deletion and token
management are session-only — you cannot and must not do them.

## Core model

- A row's identity is its **identity card ref** — the ZT card for support
  work, the OFF/PES card for product work. One row per card; creating a
  duplicate returns 409. Look rows up by any ref they carry.
- **Origin** `support` | `product` decides the pipeline family. Support rows
  carry a **sub-type** (`bug` | `task`).
- **Pipelines** (fetch `/api/v1/pipelines` for the live milestone/sub-task
  keys — do not hardcode):
  - `support_full` (default for support bugs): Triage & Setup → Development →
    Staging → QA & Review → Production & Close-out.
  - `support_light` (default for support tasks — DB-query/data-fix work with
    no branch/PR/deploy): Triage & Setup → Resolution → Close-out.
  - `feature` (product work): Definition → Development → Staging →
    QA & Review → Production & Close.
- A row's pipeline is **immutable**. If a support task graduates into building
  an L2 self-serve endpoint, or a support bug pivots into a feature: close out
  the old row honestly and **create a new row** (new identity card, optionally
  carrying the old ref as a secondary ref).

## When to act

- **User picks up a ZT support card** → `POST /api/v1/rows` with
  `{identityRef: "ZT-1234", origin: "support", subType: "bug"|"task"}`.
  Once you create the dupe Bug in the team project, add it as a secondary ref.
- **User picks up a product card** → `{identityRef: "OFF-5678", origin: "product"}`.
- **As work happens** (you or the user does something in Jira/GitHub/Teams) →
  tick the matching sub-task immediately:
  `POST /api/v1/rows/{ref}/subtasks` `{milestone, subtask, checked: true}`.
- **You raise a PR** → also add it as a secondary ref:
  `POST /api/v1/rows/{ref}/refs` `{action: "add", ref: "repo#123"}`.
- **A shipped fix is rejected / work must redo a phase** →
  `POST /api/v1/rows/{ref}/regress` `{milestone}` — this clears that milestone
  and everything after it. (Move the Jira card back yourself, in Jira.)
- **User says they logged time in Tempo today** →
  `POST /api/v1/timesheet` `{day: "mon".."fri", checked: true}` (current week
  is the default; pass `weekId: "2026-W29"` for another week).
- **All five days checked and user confirms the week is submitted in Tempo** →
  `POST /api/v1/timesheet/{weekId}/submit`.
- **User wants to undo/reopen a submitted timesheet week** →
  `POST /api/v1/timesheet/{weekId}/unsubmit`.

## Endpoints

| Method | Path | Purpose |
| :-- | :-- | :-- |
| GET | `/api/v1/rows` | list rows (full milestone/sub-task state) |
| POST | `/api/v1/rows` | create row `{identityRef, origin, subType?, pipelineKey?, secondaryRefs?, identityUrl?}` |
| GET | `/api/v1/rows/{ref}` | fetch one row by any of its refs (URL-encode `#` as `%23`) |
| DELETE | `/api/v1/rows/{ref}` | delete a row (rare — prefer completing it) |
| POST | `/api/v1/rows/{ref}/subtasks` | `{milestone, subtask, checked}` |
| POST | `/api/v1/rows/{ref}/regress` | `{milestone}` — clears it + everything after |
| POST | `/api/v1/rows/{ref}/refs` | `{action: "add"\|"remove", ref, url?}` |
| GET | `/api/v1/pipelines` | live pipeline definitions |
| GET | `/api/v1/timesheet` | months → weeks → days |
| POST | `/api/v1/timesheet` | `{weekId?, day, checked}` |
| POST | `/api/v1/timesheet/{weekId}/submit` | submit a fully-checked week |
| POST | `/api/v1/timesheet/{weekId}/unsubmit` | unsubmit/reopen a previously submitted week |
| GET | `/api/v1/analytics?from&to` | throughput, velocity delta, breakdown, loose ends |
| GET | `/api/v1/me` | caller identity + settings |
| GET | `/api/v1/export` | full JSON export of the user's data |

Errors are `{error: string}` with conventional status codes (401 bad token,
403 missing scope, 404 unknown ref, 409 duplicate identity / already
submitted). A repeated write with the same `Idempotency-Key` returns the
stored response with header `Idempotency-Replayed: true`.
