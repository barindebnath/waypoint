# Waypoint — instructions for AI agents

Waypoint is a personal **status tracker** that acts as external memory for a
developer's work. You (the AI) do real work in Jira, GitHub, and Teams through
your own connections — and then **mirror the status of that work into
Waypoint**. Waypoint never touches those tools itself.

This file is served live at `/llms.txt` on the deployed app. The API base is
`/api/v1` on the same host.

## Hard rules (read first)

1. **Never write card contents, customer data, names, credentials, or secrets
   into Waypoint.** Refs only. There is deliberately no title or free-text
   field — do not try to smuggle descriptions into ref strings.
2. **Never tick a sub-task that didn't actually happen.** Waypoint is the
   user's memory; a false tick is a corrupted memory.
3. Sub-tasks marked `humanUsual` (local testing, staging/prod testing,
   deploys) are usually done by the human. Tick them **only when the user
   explicitly tells you they're done.**
4. **`regress` is destructive** — it clears a milestone plus everything after
   it. Only call it on explicit user request; confirm the milestone before
   firing.
5. Always send an **`Idempotency-Key`** header on writes.

## Authentication

Send a personal access token (created by the user in Settings) as either:

```
Authorization: Bearer wp_XXXX
x-api-key: wp_XXXX
```

Tokens are scoped `read` or `read,write`. Account deletion and token
management are session-only — you cannot and must not do them.

## Core model

### Concepts

- **Row**: one unit of work. One card = one row.
- **Pipeline**: fixed left-to-right sequence of milestones for a row.
- **Milestone**: a phase (e.g. "Development"). Completes when all its
  sub-tasks are checked; the bar auto-advances.
- **Sub-task**: a checkbox inside a milestone. You tick these as real events
  happen. Some are `humanUsual` — see rule #3.
- **Timesheet**: weekly attestation strip (Mon–Fri) that time was logged in
  Tempo. Ticking a day means "Tempo logging for that day is done."

### Row identity

- A row's identity is its **identity card ref** — the ZT card for support
  work, the OFF/PES/EN card for product work. One row per card; creating a
  duplicate returns `409`. Look rows up by any ref they carry (identity or
  secondary).
- **Secondary refs** are PR links, dupe bugs, related tickets — anything you
  want the row to be findable by.
- **`origin`** (`support` | `product`) decides the pipeline family. Support
  rows carry a **`subType`** (`bug` | `task`).
- A row's pipeline is **immutable**. If a support task graduates into building
  an L2 self-serve endpoint, or a support bug pivots into a feature: close
  out the old row honestly and **create a new row** (new identity card,
  optionally carrying the old ref as a secondary ref).

### Pipelines

Fetch `/api/v1/pipelines` for live milestone/sub-task keys — never hardcode.

| Pipeline | Milestones | Default for | Notes |
| :-- | :-- | :-- | :-- |
| `support_full` | Triage & Setup → Development → Staging → QA & Review → Production & Close-out | `origin: support, subType: bug` | Fix ships through the full dev → prod flow |
| `support_light` | Triage & Setup → Resolution → Close-out | `origin: support, subType: task` | DB-query / data-fix work with no branch/PR/deploy |
| `feature` | Definition → Development → Staging → QA & Review → Production & Close | `origin: product` | Greenfield + enhancement work |

Some sub-tasks are flagged **`humanUsual: true`** in the `/api/v1/pipelines`
response — respect that flag per hard rule #3.

## When to act

| Event | Action |
| :-- | :-- |
| User picks up a ZT support card | `POST /rows {identityRef: "ZT-1234", origin: "support", subType: "bug"\|"task"}` |
| User picks up a product card | `POST /rows {identityRef: "OFF-5678", origin: "product"}` |
| A dupe Bug is created in the team project | `POST /rows/ZT-1234/refs {action: "add", ref: "OFF-9999"}` + tick `triage.dupe_bug_created` |
| A real world event happens (branch, commit, PR, deploy, comment…) | `POST /rows/{ref}/subtasks {milestone, subtask, checked: true}` |
| Every sub-task in a milestone is done at once | `POST /rows/{ref}/subtasks {milestone, checked: true}` — omit `subtask` to atomically check all in one transaction |
| You raise a PR | Also add it as a secondary ref: `POST /rows/{ref}/refs {action: "add", ref: "myrepo#123"}` |
| A shipped fix is rejected / a phase must be redone | `POST /rows/{ref}/regress {milestone}` (destructive — user must ask; move the Jira card back yourself) |
| User says they logged time in Tempo today | `POST /timesheet {day: "mon".."fri", checked: true}` (current week default; pass `weekId: "2026-W29"` for another week) |
| All five days ticked and user confirms the Tempo week is submitted | `POST /timesheet/{weekId}/submit` |
| User wants to reopen a submitted week | `POST /timesheet/{weekId}/unsubmit` |

## Endpoints

All paths are prefixed with `/api/v1`.

| Method | Path | Purpose | Body |
| :-- | :-- | :-- | :-- |
| GET | `/rows` | List rows (full milestone/sub-task state) | — |
| POST | `/rows` | Create a row | `{identityRef, origin, subType?, pipelineKey?, secondaryRefs?, identityUrl?}` |
| GET | `/rows/{ref}` | Fetch one row by any of its refs | — |
| DELETE | `/rows/{ref}` | Delete a row (rare — prefer completing it) | — |
| POST | `/rows/{ref}/subtasks` | Tick a sub-task, or bulk-check every sub-task in a milestone | `{milestone, subtask?, checked}` |
| POST | `/rows/{ref}/regress` | Clear a milestone + everything after | `{milestone}` |
| POST | `/rows/{ref}/refs` | Add or remove a secondary ref | `{action: "add"\|"remove", ref, url?}` |
| GET | `/pipelines` | Live pipeline definitions | — |
| GET | `/timesheet` | Months → weeks → days | — |
| POST | `/timesheet` | Tick a day | `{weekId?, day, checked}` |
| POST | `/timesheet/{weekId}/submit` | Submit a fully-checked week | — |
| POST | `/timesheet/{weekId}/unsubmit` | Reopen a submitted week | — |
| GET | `/analytics?from&to` | Throughput, velocity delta, breakdown, loose ends | — |
| GET | `/me` | Caller identity + settings | — |
| GET | `/export` | Full JSON export of the user's data | — |

## Conventions

**URL encoding.** Refs may contain `#` (repo-style like `myrepo#42`). URL-encode
as `%23` in paths.

**Idempotency-Key format.** Deterministic per intent — e.g.
`create-ZT-1234-20260719` for a row create, `ZT-1234-development-pr_raised-check`
for a sub-task tick. Repeats return the stored response plus header
`Idempotency-Replayed: true`.

**Timezones.** Timesheet days (`mon`..`fri`) resolve against the user's
`timezone` on `/me`. Week IDs are ISO 8601 (`YYYY-Www`).

**Ref formats.**
- Identity refs: your project's card prefix (e.g. `ZT-1234`, `OFF-5678`, `EN-2062`).
- Secondary refs: same shape, plus repo-style `owner/repo#123` for PRs.

**Errors.** `{error: string}` with conventional status codes:

| Code | Meaning |
| :-- | :-- |
| `401` | Bad or missing token |
| `403` | Token lacks the required scope (e.g. `write`) |
| `404` | Unknown row / ref |
| `409` | Duplicate identity, or week already submitted |

**Failure handling.** If a Waypoint call fails, do the real work anyway and
note the failure in chat — Waypoint is a mirror, not a gate.
