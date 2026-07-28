# Waypoint GitHub PR & Jira Card Status Sync — Design Document

**Date:** 2026-07-28  
**Status:** Approved  
**Scope:** GitHub PR Sync, Jira Card Status Sync, Server-side External Integrations, Auto-advancing Sub-tasks, and Live Visual Badges  

---

## 1. Executive Summary

This feature enhances Waypoint by integrating live status tracking from both **GitHub** and **Jira** directly into ticket rows:
1. **GitHub PR Sync**: Links 1 GitHub PR per ticket row, syncing PR states (`Open`, `Draft`, `Conflicts`, `In Review`, `Approved`, `Merged`, `Closed`).
2. **Jira Card Status Sync**: Syncs live status for identity/project cards (`ZT-xxxx`, `OFF-xxxx`, `PES-xxxx`) from Jira REST API (e.g. `In Progress`, `Code Review`, `Ready for QA`, `Done`).
3. **Automated Progress Engine**: Auto-checks matching milestone sub-tasks based on GitHub PR and Jira card state updates.
4. **Live Visual Badges**: Renders clear visual badges on both identity refs (Jira) and secondary PR pills (GitHub) in the dashboard UI.

---

## 2. Core Business Rules & Privacy Compliance

1. **Data Privacy & Ref-Only Constraint (Rule #1)**: Waypoint stores reference keys (`OFF-1234`, `myrepo#89`) and status names (`In Progress`, `Merged`), but **never** card contents, titles, customer data, descriptions, or secrets.
2. **Strict 1-to-1 PR Mapping**: A ticket row can carry at most **one** GitHub PR reference (`kind: "github_pr"` in `secondaryRefs`). Linking a new PR ref replaces any pre-existing PR ref on that row.
3. **Credential Privacy**: User credentials (GitHub PAT, Jira Email + API Token) are stored per user in `user_settings` and used server-side only.

---

## 3. Visual Badges System

### 3.1 GitHub PR Badges
Pills for linked GitHub PR refs display:

| Badge | Condition / GitHub State | Indicator |
| :--- | :--- | :--- |
| **Open** | `state === 'open'` and clean mergeable | 🟢 Green Pill |
| **Draft** | `draft === true` | ⚪ Gray Pill |
| **Has Conflicts** | `mergeableState === 'dirty'` | ⚠️ Amber Alert Pill |
| **In Review / Changes Requested** | `reviewDecision === 'changes_requested'` or review required | 🟡 Yellow Pill |
| **Approved** | `reviewDecision === 'approved'` | ✅ Green Check Pill |
| **Merged** | `state === 'merged'` | 🟣 Purple Pill |
| **Closed** | `state === 'closed'` (unmerged) | 🔴 Red Pill |

### 3.2 Jira Card Status Badges
Pills for Jira Identity / Secondary refs display:

| Jira Status Category | Visual Badge Indicator | Example |
| :--- | :--- | :--- |
| **To Do / Triage** | ⚪ Gray Badge | `OFF-1234 • ⚪ To Do` |
| **In Progress / Development** | 🔵 Blue Badge | `OFF-1234 • 🔵 In Progress` |
| **Code Review** | 🟡 Yellow Badge | `OFF-1234 • 🟡 Code Review` |
| **Staging / Ready for QA** | 🟧 Orange Badge | `OFF-1234 • 🟧 Ready for QA` |
| **In QA** | 🟣 Purple Badge | `OFF-1234 • 🟣 In QA` |
| **Done / Closed** | ✅ Green Check Badge | `OFF-1234 • ✅ Done` |

---

## 4. Auto-Advancing Sub-task Matrix

When an external sync runs, Waypoint's progress engine (`src/lib/engine.ts`) auto-checks sub-tasks:

| Source | Trigger Condition | Target Waypoint Sub-task |
| :--- | :--- | :--- |
| **GitHub** | PR exists / detected | `development.pr_raised` |
| **GitHub** | `reviewDecision === 'approved'` | `qa_review.pr_reviewed` |
| **GitHub** | `state === 'merged'` | `prod_close.merged_main` |
| **Jira** | Status $\rightarrow$ `In Progress` | `definition.moved_in_progress` & `development.worked_on_card` |
| **Jira** | Status $\rightarrow$ `Code Review` | `development.card_code_review` |
| **Jira** | Status $\rightarrow$ `Ready for QA` | `staging.card_ready_for_qa` |
| **Jira** | Status $\rightarrow$ `Done` | `prod_close.card_done` |

---

## 5. Database Schema Extensions (`src/lib/db/schema.ts`)

### 5.1 `user_settings` Table Extensions
- `githubPat`: `text` (optional GitHub Personal Access Token).
- `githubDefaultOrg`: `text` (optional default owner/org name).
- `jiraEmail`: `text` (optional Jira user email).
- `jiraApiToken`: `text` (optional Jira API Token).

### 5.2 `pr_status_cache` Table
- `prRef`: `text` (Primary Key, e.g. `owner/repo#123`).
- `userId`: `text` (FK to `user.id`).
- `state`: `text` (`open`, `closed`, `merged`, `draft`).
- `mergeableState`: `text` (`clean`, `dirty`, `blocked`, `unknown`).
- `reviewDecision`: `text` (`approved`, `changes_requested`, `review_required`, `none`).
- `updatedAt`: `timestamp` with timezone.

### 5.3 `jira_status_cache` Table
- `cardRef`: `text` (Primary Key, e.g. `OFF-1234`, `ZT-5678`).
- `userId`: `text` (FK to `user.id`).
- `statusName`: `text` (e.g. `In Progress`, `Code Review`, `Done`).
- `statusCategory`: `text` (`todo`, `inprogress`, `done`).
- `updatedAt`: `timestamp` with timezone.

---

## 6. API Endpoints & Core Utilities

### 6.1 GitHub & Jira Integration Clients
- `src/lib/github.ts`: REST API integration to fetch PR details and reviews.
- `src/lib/jira.ts`: REST API integration (`/rest/api/3/issue/{issueIdOrKey}`) to fetch issue status.

### 6.2 External Sync Endpoint (`POST /api/v1/integrations/sync`)
- Fetches active ticket rows for user.
- Calls GitHub API for `github_pr` refs and Jira API for Jira identity/secondary refs.
- Updates `pr_status_cache` and `jira_status_cache`.
- Invokes `applySubtaskCheck()` in `src/lib/engine.ts` to advance milestone progress.
- Returns updated rows and status caches for UI consumption.

---

## 7. UI Components & Layout Updates

1. **Ticket Row Header (`src/components/ticket-row.tsx`)**:
   - Render Jira identity ref with live Jira status badge pill.
   - Render linked GitHub PR ref with live GitHub status badge pill.
   - Quick `+ Link PR` button when no PR is linked.
2. **Settings Page (`src/app/settings/page.tsx`)**:
   - **GitHub Integration**: PAT, Default Org, Test Connection button.
   - **Jira Integration**: Jira Base URL, Jira Email, API Token, Test Connection button.
