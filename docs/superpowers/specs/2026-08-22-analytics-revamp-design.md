# Analytics Page Upgrade — Executive & Flow Intelligence Spec

**Date**: 2026-08-22  
**Author**: Data Analytics Lead  
**Status**: Approved  

---

## 1. Executive Summary & Objectives

The goal of this upgrade is to transform Waypoint's `/analytics` page into an **Executive & Flow Intelligence Dashboard**. It equips engineering leaders, product managers, and individual developers with deep, high-signal delivery insights without relying on story-point estimation theater.

### Key Objectives:
1. **Flow & Cycle Time Metrics**: Track Lead Time (Creation to Completion), Milestone Dwell Time Breakdown (identifying stage bottlenecks), and Work-in-Progress (WIP) Aging.
2. **Executive Scorecards**: High-density KPI cards for Throughput Velocity, Mean Lead Time, WIP Flow Health, and Verification Discipline.
3. **Standup & Delivery Digest**: Quick standup watchlist of aging cards and a one-click "Copy Standup Digest" action formatted in Markdown for Slack/Teams/Status emails.
4. **Origin Slicing**: Dynamic filtering across All Work, Support Bugs, Support Tasks, and Product Features across configurable date ranges (`7d`, `14d`, `30d`, `90d`, Custom).

---

## 2. Architecture & Data Model

### 2.1 Backend Endpoint (`GET /api/v1/analytics`)

#### Query Parameters:
- `from` (string, ISO date `YYYY-MM-DD`): Start date in user's timezone. Default: 30 days ago.
- `to` (string, ISO date `YYYY-MM-DD`): End date in user's timezone. Default: today.
- `origin` (optional string): Filter by origin/type — `"all"` (default) | `"support_bug"` | `"support_task"` | `"product"`.

#### Response Schema:
```typescript
export interface AnalyticsData {
  range: {
    from: string;
    to: string;
    bucket: "day" | "week";
    days: number;
  };
  filter: {
    origin: "all" | "support_bug" | "support_task" | "product";
  };
  velocity: {
    completed: number;
    previous: number;
    deltaPct: number | null;
  };
  leadTime: {
    avgDays: number | null;
    medianDays: number | null;
    prevAvgDays: number | null;
    deltaPct: number | null; // Negative is faster (improvement)
    fastest: { ref: string; days: number } | null;
    slowest: { ref: string; days: number } | null;
  };
  wip: {
    total: number;
    stalledCount: number; // Cards in flight > 7 days
    agingList: Array<{
      identityRef: string;
      origin: "support" | "product";
      subType: "bug" | "task" | null;
      currentMilestone: string;
      ageDays: number;
      isStalled: boolean;
    }>;
  };
  discipline: {
    looseEndsCount: number;
    looseEndsRefs: string[];
    subtaskVerificationRatePct: number; // Checked subtasks / total subtasks on completed cards
  };
  stageDwellTimes: Array<{
    milestoneKey: string;
    label: string;
    avgHours: number;
    avgDays: number;
    percentage: number;
    isBottleneck: boolean;
  }>;
  throughput: Array<{
    bucket: string;
    count: number;
    supportBugCount: number;
    supportTaskCount: number;
    productCount: number;
  }>;
  breakdown: {
    support_bug: number;
    support_task: number;
    product: number;
    total: number;
  };
}
```

### 2.2 Flow Computation Engine

1. **Lead Time Calculation**:
   - For every completed row in the specified date range:
     $$\text{leadTime} = \text{lastMilestone.updatedAt} - \text{row.createdAt}$$
   - Calculate Mean (Average), Median, Min (Fastest), and Max (Slowest).
   - Compare with the previous equal-length time window to compute `deltaPct`.

2. **Milestone Dwell Time Breakdown**:
   - For rows that traversed pipeline stages, calculate time spent in each milestone:
     - First milestone: `milestone[0].updatedAt - row.createdAt`
     - Milestone $i > 0$: `milestone[i].updatedAt - milestone[i-1].updatedAt`
   - Aggregate average hours/days per milestone key across all completed cards.
   - The milestone with the highest average dwell time is flagged with `isBottleneck: true`.

3. **WIP Aging & Stalled Radar**:
   - For all active rows (`isComplete === false`):
     $$\text{ageDays} = \text{now} - \text{row.createdAt}$$
   - Any card with $\text{ageDays} \ge 7$ is classified as `isStalled: true`.
   - Sort aging list descending by age.

4. **Verification Discipline**:
   - Total subtasks checked across completed cards / Total possible subtasks across those cards.
   - Count and list of rows with loose ends (`hasLooseEnds === true`).

---

## 3. Frontend UI & Visual Hierarchy

### 3.1 Header & Filter Bar
- Title: **Analytics** with subtitle: *"Flow metrics, lead time & delivery intelligence"*.
- Date Presets: `7d`, `14d`, `30d`, `90d` chips + custom date inputs.
- Origin Segment Toggle: `All Work`, `Support Bugs`, `Support Tasks`, `Product Features`.

### 3.2 Tier 1: Executive KPI Grid (4 Cards)
1. **Cards Shipped**: Big tabular-num counter + delta % badge vs prior period (`▲ 25% vs last period`).
2. **Mean Lead Time**: Average days/hours to ship, median sub-metric, and comparison trend (`▼ 18% faster`).
3. **In-Flight WIP & Aging**: Active cards count with amber/red alert pill when stalled items exist.
4. **Verification Discipline**: Subtask check rate percentage (e.g. `96% verified`) + Loose ends indicator.

### 3.3 Tier 2: Flow Diagnostics & Visualizations
1. **Milestone Cycle-Time & Bottleneck Radar**:
   - Multi-segment proportional bar displaying time distribution across pipeline stages.
   - Badges showing exact average dwell time per stage and highlighting the bottleneck stage.
2. **Throughput Trend Chart**:
   - Stacked daily/weekly bar chart using theme tokens (`var(--support)`, `var(--done)`, `var(--product)`).
   - Hover tooltips and collapsible Table View.
3. **Completions by Origin**:
   - Breakdown bar comparison with percentage shares.

### 3.4 Tier 3: Standup & Executive Digest Section
1. **Aging Items Watchlist Table**:
   - Ref link, origin pill, current milestone, and age badge (colored amber if stalled $> 7\text{d}$).
2. **"Copy Standup Digest" Button**:
   - Generates markdown formatted summary ready to paste into Slack/Teams/email standups.

---

## 4. Verification Plan

### Automated & Unit Verification:
- Run `npm run build` / `next build` to verify clean TypeScript compilation and build validity.
- Run `npm run lint` to ensure ESLint compliance.
- Test `GET /api/v1/analytics` with various query parameters (`from`, `to`, `origin`) verifying correct metric calculations.

### Functional UI Verification:
- Test date preset switches (`7d`, `14d`, `30d`, `90d`).
- Test origin filtering (`all`, `support_bug`, `support_task`, `product`).
- Verify "Copy Standup Digest" clipboard action.
- Verify dark/light theme switching and responsive mobile/tablet layout.
