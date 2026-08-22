# Analytics Revamp — Executive & Flow Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Waypoint's `/analytics` page and `/api/v1/analytics` backend into an executive and flow intelligence dashboard featuring lead times, stage bottleneck radar, WIP aging, origin filtering, and a one-click standup digest generator.

**Architecture:** Extend `src/app/api/v1/analytics/route.ts` to compute comprehensive flow statistics from completed and active rows (lead time, stage dwell times, WIP aging, verification discipline, and origin breakdowns). Update `src/lib/client-api.ts` with new typed API contracts. Rebuild `src/app/(app)/analytics/page.tsx` into a 3-tier high-density dashboard matching Waypoint's paper/nord/forest/royal design system.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Drizzle ORM / PostgreSQL, Luxon (timezone-aware date calculations), Tailwind CSS v4.

## Global Constraints
- Timezone awareness: All date filtering, bucketing, and calculations must use the user's configured timezone (`user.timezone`).
- No external heavy chart libraries: Build clean, accessible, theme-tokenized SVG/HTML/CSS visualizations.
- Zero customer/secret data leakage: Only identity refs, timestamps, and aggregate statistics are exposed.
- Theme fidelity: Strictly use CSS variable tokens (`var(--surface)`, `var(--ink)`, `var(--accent)`, `var(--support)`, `var(--done)`, `var(--warn)`, `var(--danger)`).

---

### Task 1: Backend Flow Analytics API (`src/app/api/v1/analytics/route.ts`)

**Files:**
- Modify: `src/app/api/v1/analytics/route.ts`

**Interfaces:**
- Consumes: `requireUser()`, `listRows(userId)`, `RowView` from `@/lib/engine`
- Produces: Enhanced `GET /api/v1/analytics?from=&to=&origin=` endpoint returning:
  - `range: { from, to, bucket, days }`
  - `filter: { origin }`
  - `velocity: { completed, previous, deltaPct }`
  - `leadTime: { avgDays, medianDays, prevAvgDays, deltaPct, fastest, slowest }`
  - `wip: { total, stalledCount, agingList }`
  - `discipline: { looseEndsCount, looseEndsRefs, subtaskVerificationRatePct }`
  - `stageDwellTimes: Array<{ milestoneKey, label, avgHours, avgDays, percentage, isBottleneck }>`
  - `throughput: Array<{ bucket, count, supportBugCount, supportTaskCount, productCount }>`
  - `breakdown: { support_bug, support_task, product, total }`

- [ ] **Step 1: Implement Flow Analytics logic in route.ts**
  - Add origin filtering (`all`, `support_bug`, `support_task`, `product`).
  - Add lead time calculations: difference in days between `createdAt` and final milestone `updatedAt`.
  - Add stage dwell time calculations per milestone across completed rows in range.
  - Identify bottleneck stage (milestone with highest average dwell duration).
  - Add WIP aging list for all active rows (`isComplete === false`), marking cards with age $\ge 7$ days as `isStalled: true`.
  - Calculate subtask verification completion percentage on completed rows.
  - Return complete typed JSON response.

- [ ] **Step 2: Verify API route TypeScript types and logic**
  - Ensure zero type errors and correct handling of empty data sets / zero division edge cases.

- [ ] **Step 3: Commit Task 1**
  ```bash
  git add src/app/api/v1/analytics/route.ts
  git commit -m "feat(analytics): add flow metrics, lead time, wip aging, and stage bottlenecks to analytics API"
  ```

---

### Task 2: Client API & Interface Definitions (`src/lib/client-api.ts`)

**Files:**
- Modify: `src/lib/client-api.ts`

**Interfaces:**
- Produces: `AnalyticsData` interface and updated `api.analytics(from, to, origin?)` method.

- [ ] **Step 1: Update client-api.ts with complete AnalyticsData interface**
  - Define TypeScript types matching the backend response.
  - Update `api.analytics` to accept optional `origin?: string` parameter:
    `analytics: (from: string, to: string, origin = "all") => request<AnalyticsData>(`/api/v1/analytics?from=${from}&to=${to}&origin=${origin}`)`

- [ ] **Step 2: Commit Task 2**
  ```bash
  git add src/lib/client-api.ts
  git commit -m "feat(analytics): update client api types for analytics flow metrics"
  ```

---

### Task 3: Rebuild `/analytics` Page UI (`src/app/(app)/analytics/page.tsx`)

**Files:**
- Modify: `src/app/(app)/analytics/page.tsx`

**Interfaces:**
- Consumes: `api.analytics(from, to, origin)`, `useQuery` from `@tanstack/react-query`
- Produces: Executive and Flow Intelligence UI matching Waypoint design system.

- [ ] **Step 1: Build Header & Filter Controls**
  - Date presets: `7d` (6 days ago), `14d` (13 days ago), `30d` (29 days ago), `90d` (89 days ago) + custom date pickers.
  - Work type filter chips: `All Work`, `Support Bugs`, `Support Tasks`, `Product Features`.

- [ ] **Step 2: Build Tier 1: Executive KPI Scorecards Grid**
  - **Cards Shipped Card**: Big tabular number, delta % vs prior period (`▲ 25% vs last period`), previous count.
  - **Mean Lead Time Card**: Average days, median lead time, delta comparison (`▼ 18% faster`), fastest & slowest refs.
  - **Active WIP & Aging Card**: Total active in flight, stalled warning badge (`X stalled > 7d`).
  - **Verification Discipline Card**: Subtask verification rate (`96% verified`) + Loose ends indicator with direct links to dashboard.

- [ ] **Step 3: Build Tier 2: Flow Diagnostics & Visualizations**
  - **Milestone Bottleneck & Cycle Time Distribution Bar**:
    - Multi-segment proportional horizontal bar showing average time spent per stage.
    - Badges for each stage showing average hours/days and a prominent highlight for the active bottleneck stage.
  - **Throughput & Velocity Trend Stacked Bar Chart**:
    - Daily/weekly stacked bar chart categorized by origin (`Support Bug`, `Support Task`, `Product`).
    - Tooltip on hover showing date and count per category.
    - Collapsible Table View for granular review.
  - **Completions by Origin**:
    - Progress bars showing split and percentage of bugs vs tasks vs product.

- [ ] **Step 4: Build Tier 3: Standup & Executive Digest Section**
  - **In-Flight Aging Watchlist**:
    - Interactive table of active cards showing identity ref, origin pill, current milestone, and age badge (colored amber if $\ge 7\text{d}$).
  - **"Copy Standup Digest" Button**:
    - Generates markdown formatted summary of shipped cards, lead times, in-flight WIP, and bottleneck alerts with a copy-to-clipboard toast/confirmation.

- [ ] **Step 5: Verify responsiveness and theme support**
  - Verify layout on mobile, tablet, and desktop viewports.
  - Verify styling in light and dark mode across Paper, Nordic, Forest, and Royal themes.

- [ ] **Step 6: Commit Task 3**
  ```bash
  git add src/app/\(app\)/analytics/page.tsx
  git commit -m "feat(analytics): overhaul analytics page with executive KPIs, bottleneck radar, wip aging, and standup digest"
  ```

---

### Task 4: Verification & Build Validation

**Files:**
- Test scripts and build verification.

- [ ] **Step 1: Run TypeScript & ESLint validation**
  ```bash
  npm run lint
  npm run build
  ```

- [ ] **Step 2: Functional verification of API & UI**
  - Test date preset transitions and custom date ranges.
  - Test origin filtering.
  - Test Standup Digest clipboard generator.

- [ ] **Step 3: Commit any refinements**
  ```bash
  git commit --allow-empty -m "chore(analytics): verify all analytics features and build integrity"
  ```
