# Dashboard Upgrades: Blocker Badges, 1-Click Fast Advance, Smart URL Parser & Sync Suggestions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Waypoint dashboard with 4 core developer workflow enhancements: Actionable Blocker Badges on collapsed cards, 1-Click "Next Action" Fast-Advance button, Smart URL / Clipboard Auto-Parser in New Row Form, and Sync Freshness with proactive Advance Suggestions.

**Architecture:** 
- Frontend-driven state and component enhancements in Next.js / React with `@tanstack/react-query`.
- New parsing utility `src/lib/smart-parser.ts` to cleanly extract Jira/GitHub references and detect card origins.
- Visual enhancements in `src/components/row-card.tsx` (blocker chips, hover next-action quick button).
- Form enhancement in `src/components/new-row-form.tsx` with clipboard auto-detection and smart paste.
- Sync freshness tracking and smart suggestion banner in `src/app/(app)/dashboard/page.tsx`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, TanStack React Query.

## Global Constraints

- Never write card contents or customer data into Waypoint; refs and metadata only.
- Never tick a `humanUsual` sub-task without explicit user interaction/confirmation.
- Maintain full responsiveness across mobile, tablet, and desktop layouts.
- Follow existing color tokens (`accent`, `edge`, `surface`, `surface-2`, `ink`, `ink-muted`, `done`, `warn`, `danger`).

---

### Task 1: Smart Card & URL Parser Utility

**Files:**
- Create: `src/lib/smart-parser.ts`

- [ ] **Step 1: Write `src/lib/smart-parser.ts`**
- [ ] **Step 2: Commit `src/lib/smart-parser.ts`**

---

### Task 2: Actionable Blocker & Attention Badges on Collapsed Cards

**Files:**
- Modify: `src/components/row-card.tsx`
- Modify: `src/components/status-badge.tsx`

- [ ] **Step 1: Implement Blocker Calculations and Badges in `RowCard`**
- [ ] **Step 2: Verify Blocker Badges render cleanly on collapsed card without layout shifting**
- [ ] **Step 3: Commit changes to `src/components/row-card.tsx`**

---

### Task 3: 1-Click "Next Action" Fast-Advance on Collapsed Rows

**Files:**
- Modify: `src/components/row-card.tsx`

- [ ] **Step 1: Add Next Subtask Resolver and Advance Button**
- [ ] **Step 2: Verify smooth optimistic update and loading states**
- [ ] **Step 3: Commit changes to `src/components/row-card.tsx`**

---

### Task 4: Smart URL / Clipboard Auto-Parser in New Row Form

**Files:**
- Modify: `src/components/new-row-form.tsx`

- [ ] **Step 1: Integrate Smart Parser and Clipboard Support in `NewRowForm`**
- [ ] **Step 2: Verify paste handling, clipboard permission handling, and manual overrides**
- [ ] **Step 3: Commit changes to `src/components/new-row-form.tsx`**

---

### Task 5: Sync Freshness Indicator & Proactive Advance Suggestions

**Files:**
- Create: `src/components/advance-suggestion-banner.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create `AdvanceSuggestionBanner` component**
- [ ] **Step 2: Integrate Sync Freshness and Suggestion Banner in `DashboardPage`**
- [ ] **Step 3: Test and Commit changes**

---

### Task 6: End-to-End Verification & Polish

- [ ] Run `npm run lint` and `npm run build` to verify zero TypeScript, ESLint, or bundle issues.
- [ ] Manual walkthrough across dark/light themes and mobile/desktop viewport sizes.
- [ ] Create walkthrough artifact.
