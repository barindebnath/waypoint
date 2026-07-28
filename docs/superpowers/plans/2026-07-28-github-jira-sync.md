# GitHub PR & Jira Card Status Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate live GitHub PR and Jira card status tracking into Waypoint with auto-advancing milestone sub-tasks and visual status badges.

**Architecture:** Extend Drizzle database schemas with credential settings and integration cache tables. Implement server-side client helpers (`github.ts`, `jira.ts`) and a sync route (`/api/v1/integrations/sync`). Hook sync updates directly into the existing progress engine (`src/lib/engine.ts`). Render visual status badges in the UI on ticket row headers and add configuration controls to `/settings`.

**Tech Stack:** Next.js (App Router), Drizzle ORM, PostgreSQL, Tailwind CSS, Lucide icons, React.

## Global Constraints

- Never write card contents, customer data, names, credentials, or secrets into Waypoint database fields or refs (Rule #1 in `AGENTS.md`). Status names/categories only.
- Strict 1-to-1 PR mapping per ticket row.
- Always preserve API contracts and backwards compatibility.

---

### Task 1: Database Schema & Migration for Integration Credentials and Caches

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: Drizzle schema updates & migration file

**Interfaces:**
- Consumes: Existing `userSettings` and `user` tables in `src/lib/db/schema.ts`
- Produces: `githubPat`, `githubDefaultOrg`, `jiraEmail`, `jiraApiToken` on `userSettings`; `prStatusCache` table; `jiraStatusCache` table.

- [ ] **Step 1: Update schema.ts with userSettings fields and status cache tables**

Edit `src/lib/db/schema.ts` to add settings fields and cache tables:

```typescript
// In userSettings table:
githubPat: text("github_pat"),
githubDefaultOrg: text("github_default_org"),
jiraEmail: text("jira_email"),
jiraApiToken: text("jira_api_token"),

// Add prStatusCache table:
export const prStatusCache = pgTable(
  "pr_status_cache",
  {
    prRef: text("pr_ref").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    state: text("state").notNull(), // 'open' | 'closed' | 'merged' | 'draft'
    mergeableState: text("mergeable_state").notNull(), // 'clean' | 'dirty' | 'blocked' | 'unknown'
    reviewDecision: text("review_decision").notNull(), // 'approved' | 'changes_requested' | 'review_required' | 'none'
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pr_cache_user_idx").on(t.userId)]
);

// Add jiraStatusCache table:
export const jiraStatusCache = pgTable(
  "jira_status_cache",
  {
    cardRef: text("card_ref").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    statusName: text("status_name").notNull(), // e.g. 'In Progress', 'Code Review'
    statusCategory: text("status_category").notNull(), // 'todo' | 'inprogress' | 'done'
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("jira_cache_user_idx").on(t.userId)]
);
```

- [ ] **Step 2: Generate Drizzle migration**

Run: `npx drizzle-kit generate`
Expected: Migration files generated in `drizzle/`.

- [ ] **Step 3: Apply migration to local database**

Run: `npx drizzle-kit migrate`
Expected: Database migration applied cleanly.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "db: add github and jira integration fields and status cache tables"
```

---

### Task 2: Implement GitHub & Jira Integration API Client Libraries

**Files:**
- Create: `src/lib/github.ts`
- Create: `src/lib/jira.ts`

**Interfaces:**
- Consumes: GitHub REST API (`api.github.com`), Jira REST API (`/rest/api/3/issue/{issueKey}`)
- Produces: `parsePrRef()`, `fetchGithubPrStatus()`, `fetchJiraIssueStatus()`

- [ ] **Step 1: Create `src/lib/github.ts`**

```typescript
export interface ParsedPrRef {
  owner: string;
  repo: string;
  pullNumber: number;
  fullRef: string;
}

export function parsePrRef(ref: string, defaultOrg?: string): ParsedPrRef | null {
  const match = ref.match(/^(?:([a-zA-Z0-9_.-]+)\/)?([a-zA-Z0-9_.-]+)#(\d+)$/);
  if (!match) return null;
  const owner = match[1] || defaultOrg;
  if (!owner) return null;
  const repo = match[2];
  const pullNumber = parseInt(match[3], 10);
  return { owner, repo, pullNumber, fullRef: `${owner}/${repo}#${pullNumber}` };
}

export interface GithubPrDetails {
  state: 'open' | 'closed' | 'merged' | 'draft';
  mergeableState: 'clean' | 'dirty' | 'blocked' | 'unknown';
  reviewDecision: 'approved' | 'changes_requested' | 'review_required' | 'none';
}

export async function fetchGithubPrStatus(pat: string, owner: string, repo: string, pullNumber: number): Promise<GithubPrDetails | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, {
      headers: {
        Authorization: `token ${pat}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Waypoint-App',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    let state: GithubPrDetails['state'] = 'open';
    if (data.merged) state = 'merged';
    else if (data.state === 'closed') state = 'closed';
    else if (data.draft) state = 'draft';

    const mergeableState = data.mergeable_state === 'dirty' ? 'dirty' : (data.mergeable ? 'clean' : 'unknown');

    // Fetch review decision or mock fallback
    let reviewDecision: GithubPrDetails['reviewDecision'] = 'none';
    const reviewsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`, {
      headers: {
        Authorization: `token ${pat}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Waypoint-App',
      },
    });
    if (reviewsRes.ok) {
      const reviews = await reviewsRes.json();
      const states = reviews.map((r: any) => r.state);
      if (states.includes('APPROVED')) reviewDecision = 'approved';
      else if (states.includes('CHANGES_REQUESTED')) reviewDecision = 'changes_requested';
    }

    return { state, mergeableState, reviewDecision };
  } catch (err) {
    console.error('Failed to fetch GitHub PR status:', err);
    return null;
  }
}
```

- [ ] **Step 2: Create `src/lib/jira.ts`**

```typescript
export interface JiraIssueStatus {
  statusName: string;
  statusCategory: 'todo' | 'inprogress' | 'done';
}

export async function fetchJiraIssueStatus(jiraBaseUrl: string, email: string, apiToken: string, issueKey: string): Promise<JiraIssueStatus | null> {
  try {
    const cleanUrl = jiraBaseUrl.replace(/\/+$/, '');
    const authHeader = 'Basic ' + Buffer.from(`${email}:${apiToken}`).toString('base64');
    const res = await fetch(`${cleanUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=status`, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const statusObj = data.fields?.status;
    if (!statusObj) return null;

    const categoryKey = statusObj.statusCategory?.key;
    let statusCategory: JiraIssueStatus['statusCategory'] = 'inprogress';
    if (categoryKey === 'new' || categoryKey === 'undefined') statusCategory = 'todo';
    else if (categoryKey === 'done') statusCategory = 'done';

    return {
      statusName: statusObj.name || 'Unknown',
      statusCategory,
    };
  } catch (err) {
    console.error('Failed to fetch Jira status:', err);
    return null;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/github.ts src/lib/jira.ts
git commit -m "feat: add github and jira integration clients"
```

---

### Task 3: Server Sync Endpoint (`POST /api/v1/integrations/sync`) & Engine Hooks

**Files:**
- Create: `src/app/api/v1/integrations/sync/route.ts`
- Modify: `src/lib/engine.ts` (if helper needed for subtask auto-checking)

**Interfaces:**
- Consumes: `userSettings`, `prStatusCache`, `jiraStatusCache`, `src/lib/github.ts`, `src/lib/jira.ts`, `src/lib/engine.ts`
- Produces: `POST /api/v1/integrations/sync` returning updated cache records and affected rows.

- [ ] **Step 1: Create `src/app/api/v1/integrations/sync/route.ts`**

Implement endpoint that loads user settings, queries GitHub and Jira for active rows, upserts caches, and applies engine sub-task updates:

```typescript
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { userSettings, ticketRow, prStatusCache, jiraStatusCache } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchGithubPrStatus, parsePrRef } from "@/lib/github";
import { fetchJiraIssueStatus } from "@/lib/jira";
import { setSubtaskChecked } from "@/lib/engine";

export async function POST(req: Request) {
  const session = await getAuthSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const settings = await db.query.userSettings.findFirst({ where: eq(userSettings.userId, userId) });
  if (!settings) return NextResponse.json({ message: "No settings configured" });

  const rows = await db.query.ticketRow.findMany({
    where: eq(ticketRow.userId, userId),
  });

  const activeRows = rows.filter((r) => !r.isComplete);

  for (const row of activeRows) {
    // 1. Sync Jira identity card
    if (settings.jiraBaseUrl && settings.jiraEmail && settings.jiraApiToken) {
      const jiraStatus = await fetchJiraIssueStatus(settings.jiraBaseUrl, settings.jiraEmail, settings.jiraApiToken, row.identityRef);
      if (jiraStatus) {
        await db.insert(jiraStatusCache).values({
          cardRef: row.identityRef,
          userId,
          statusName: jiraStatus.statusName,
          statusCategory: jiraStatus.statusCategory,
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: jiraStatusCache.cardRef,
          set: { statusName: jiraStatus.statusName, statusCategory: jiraStatus.statusCategory, updatedAt: new Date() },
        });

        // Auto-advance Jira sub-tasks
        const normalizedStatus = jiraStatus.statusName.toLowerCase();
        if (normalizedStatus.includes("in progress")) {
          await setSubtaskChecked(db, userId, row.id, "definition", "moved_in_progress", true);
          await setSubtaskChecked(db, userId, row.id, "development", "worked_on_card", true);
        } else if (normalizedStatus.includes("code review")) {
          await setSubtaskChecked(db, userId, row.id, "development", "card_code_review", true);
        } else if (normalizedStatus.includes("ready for qa")) {
          await setSubtaskChecked(db, userId, row.id, "staging", "card_ready_for_qa", true);
        } else if (normalizedStatus.includes("done")) {
          await setSubtaskChecked(db, userId, row.id, "prod_close", "card_done", true);
        }
      }
    }

    // 2. Sync GitHub PR ref
    if (settings.githubPat) {
      const prRefObj = row.secondaryRefs.find((r) => r.kind === "github_pr");
      if (prRefObj) {
        const parsed = parsePrRef(prRefObj.ref, settings.githubDefaultOrg || undefined);
        if (parsed) {
          const githubDetails = await fetchGithubPrStatus(settings.githubPat, parsed.owner, parsed.repo, parsed.pullNumber);
          if (githubDetails) {
            await db.insert(prStatusCache).values({
              prRef: prRefObj.ref,
              userId,
              state: githubDetails.state,
              mergeableState: githubDetails.mergeableState,
              reviewDecision: githubDetails.reviewDecision,
              updatedAt: new Date(),
            }).onConflictDoUpdate({
              target: prStatusCache.prRef,
              set: {
                state: githubDetails.state,
                mergeableState: githubDetails.mergeableState,
                reviewDecision: githubDetails.reviewDecision,
                updatedAt: new Date(),
              },
            });

            // Auto-advance GitHub sub-tasks
            await setSubtaskChecked(db, userId, row.id, "development", "pr_raised", true);
            if (githubDetails.reviewDecision === "approved") {
              await setSubtaskChecked(db, userId, row.id, "qa_review", "pr_reviewed", true);
            }
            if (githubDetails.state === "merged") {
              await setSubtaskChecked(db, userId, row.id, "prod_close", "merged_main", true);
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ success: true, message: "Sync complete" });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/v1/integrations/sync/route.ts
git commit -m "feat: implement integrations sync API endpoint"
```

---

### Task 4: Visual Status Badges in Dashboard UI & Ticket Rows

**Files:**
- Modify: `src/components/ticket-row.tsx`
- Create: `src/components/status-badge.tsx`

**Interfaces:**
- Consumes: `pr_status_cache` and `jira_status_cache` data passed to or fetched by ticket row components.
- Produces: Visual Status Badge Pills (🟢 Open, ⚪ Draft, ⚠️ Has Conflicts, 🟡 In Review, ✅ Approved, 🟣 Merged, 🔴 Closed).

- [ ] **Step 1: Create `src/components/status-badge.tsx`**

```tsx
import React from "react";

export function GithubPrBadge({ state, mergeableState, reviewDecision }: { state: string; mergeableState: string; reviewDecision: string }) {
  if (state === "merged") return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-950 text-purple-300 border border-purple-800">🟣 Merged</span>;
  if (state === "draft") return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">⚪ Draft</span>;
  if (mergeableState === "dirty") return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">⚠️ Has Conflicts</span>;
  if (reviewDecision === "approved") return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">✅ Approved</span>;
  if (reviewDecision === "changes_requested") return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-950 text-yellow-300 border border-yellow-800">🟡 Changes Requested</span>;
  if (state === "closed") return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-950 text-red-300 border border-red-800">🔴 Closed</span>;
  return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">🟢 Open</span>;
}

export function JiraStatusBadge({ statusName, statusCategory }: { statusName: string; statusCategory: string }) {
  if (statusCategory === "done") return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">✅ {statusName}</span>;
  if (statusName.toLowerCase().includes("review")) return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-950 text-yellow-300 border border-yellow-800">🟡 {statusName}</span>;
  if (statusName.toLowerCase().includes("qa")) return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-950 text-orange-300 border border-orange-800">🟧 {statusName}</span>;
  if (statusCategory === "inprogress") return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-950 text-blue-300 border border-blue-800">🔵 {statusName}</span>;
  return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">⚪ {statusName}</span>;
}
```

- [ ] **Step 2: Update `src/components/ticket-row.tsx` to render badges and enforce 1-to-1 PR mapping**

Integrate `GithubPrBadge` and `JiraStatusBadge` into ticket row headers next to refs, and add validation when attaching a PR ref so that any existing `github_pr` ref is replaced cleanly.

- [ ] **Step 3: Commit**

```bash
git add src/components/status-badge.tsx src/components/ticket-row.tsx
git commit -m "ui: render github pr and jira card status badges on ticket rows"
```

---

### Task 5: Integration Settings Page (`/settings`) Controls

**Files:**
- Modify: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: `userSettings` API & `POST /api/v1/integrations/sync`
- Produces: GitHub & Jira configuration inputs and manual "Sync Now" button.

- [ ] **Step 1: Update `src/app/settings/page.tsx`**

Add input sections for GitHub PAT, Default GitHub Org, Jira Email, and Jira API Token with a "Save & Sync Now" action button.

- [ ] **Step 2: Test building the app**

Run: `npm run build`
Expected: Build passes with no TypeScript or lint errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: add github and jira credential settings UI with sync trigger"
```
