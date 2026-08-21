# Feature-Rich Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Waypoint landing page (`src/app/page.tsx`) into an interactive, high-craft showcase of all app features (deterministic milestone pipelines, AI agent API/llms.txt, GitHub/Jira auto-sync, weekly Tempo timesheet & AutoTempo, velocity analytics, 4-palette theme customization, and comparison matrix).

**Architecture:** Create modular, interactive client components under `src/components/landing/` with rich zero-dependency interactivity matching Waypoint's "paper & lamplight" design system, assembled into a high-performance Next.js Server Component page (`src/app/page.tsx`).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide-react / SVG icons, CSS theme variables.

---

## Global Constraints

- Design system: Respect the "paper & lamplight" tokens (`bg-surface`, `border-edge`, `text-ink`, `text-ink-muted`, `text-accent`, `text-done`, `font-serif`, etc.).
- Maintain full Light & Dark mode support and responsiveness across mobile, tablet, and desktop viewports.
- Zero customer data / references-only philosophy must be clearly represented in all demo content.
- Keep interactive components client-side (`"use client"`) and the page component server-side (`src/app/page.tsx`).

---

### Task 1: Hero Interactive Pipeline Sandbox (`interactive-pipeline-demo.tsx`)

**Files:**
- Create: `src/components/landing/interactive-pipeline-demo.tsx`

**Interfaces:**
- Produces: `export function InteractivePipelineDemo(): JSX.Element`

- [ ] **Step 1: Implement InteractivePipelineDemo component**
Create `src/components/landing/interactive-pipeline-demo.tsx` with:
- State machine containing 5 milestones: `triage`, `development`, `staging`, `qa`, `production`.
- Subtasks for each milestone (e.g. `root_cause`, `pr_raised`, `ci_passed`, `staging_test`, `prod_deploy`).
- Interactive subtask checkboxes that automatically advance the milestone when all subtasks in the current milestone are completed.
- Dynamic milestone nodes with animated live pulses, completed green checks, and connecting progress bars.
- Action buttons: "Fast-complete" (all done), "Regress to Development" (clears staging+), and "Reset".
- Ref pill showcase (`ZT-4821` [Bug], `PES-1032`, `web-client#142`).

- [ ] **Step 2: Commit Task 1**
```bash
git add src/components/landing/interactive-pipeline-demo.tsx
git commit -m "feat(landing): add interactive hero pipeline demo component"
```

---

### Task 2: Pipeline Families & Refs-Only Showcase (`pipeline-family-showcase.tsx`)

**Files:**
- Create: `src/components/landing/pipeline-family-showcase.tsx`

**Interfaces:**
- Produces: `export function PipelineFamilyShowcase(): JSX.Element`

- [ ] **Step 1: Implement PipelineFamilyShowcase component**
Create `src/components/landing/pipeline-family-showcase.tsx` with:
- Interactive tab switcher for the 3 pipelines:
  - `support_full` (Support Bug: Triage → Development → Staging → QA → Production)
  - `support_light` (Support Task: Triage → Resolution → Close-out)
  - `feature` (Product Feature: Definition → Development → Staging → QA → Production)
- Step-by-step visual diagram of milestone sequences.
- "Why References Only" callout banner highlighting zero stored card descriptions, zero credentials, zero data leaks.

- [ ] **Step 2: Commit Task 2**
```bash
git add src/components/landing/pipeline-family-showcase.tsx
git commit -m "feat(landing): add pipeline families and refs showcase component"
```

---

### Task 3: AI Agent & LLM-Native Code Showcase (`ai-agent-showcase.tsx`)

**Files:**
- Create: `src/components/landing/ai-agent-showcase.tsx`

**Interfaces:**
- Produces: `export function AiAgentShowcase(): JSX.Element`

- [ ] **Step 1: Implement AiAgentShowcase component**
Create `src/components/landing/ai-agent-showcase.tsx` with:
- Interactive tabbed code & terminal viewer:
  - Tab 1: **Natural Language Agent Prompt** (e.g. Claude Code / Cursor prompt instructing the agent to tick subtasks).
  - Tab 2: **Deterministic API Write** (cURL / Fetch call with `Idempotency-Key` and `Authorization: Bearer wp_...`).
  - Tab 3: **Live `/llms.txt` Excerpt** (Machine-readable system instructions served live by Waypoint).
- Copy-to-clipboard button and terminal-styled chrome.
- Value props: Zero card leakage, Sub-10ms response, Safe idempotency replay.

- [ ] **Step 2: Commit Task 3**
```bash
git add src/components/landing/ai-agent-showcase.tsx
git commit -m "feat(landing): add AI agent and llms.txt showcase component"
```

---

### Task 4: Jira & GitHub Real-Time Integrations Showcase (`integrations-showcase.tsx`)

**Files:**
- Create: `src/components/landing/integrations-showcase.tsx`

**Interfaces:**
- Produces: `export function IntegrationsShowcase(): JSX.Element`

- [ ] **Step 1: Implement IntegrationsShowcase component**
Create `src/components/landing/integrations-showcase.tsx` with:
- Visual interactive cards demonstrating live external tool sync:
  - **GitHub PR Status:** PR badges for Open, Draft, Checks passing, Merged, and review approvals.
  - **Jira Status Sync:** Mapping Jira board states directly to milestone ticks.
  - **Background Fan-out:** Demonstrating the `/api/v1/integrations/sync` engine that auto-advances active cards.

- [ ] **Step 2: Commit Task 4**
```bash
git add src/components/landing/integrations-showcase.tsx
git commit -m "feat(landing): add GitHub and Jira integrations showcase component"
```

---

### Task 5: Weekly Timesheet & AutoTempo Showcase (`timesheet-showcase.tsx`)

**Files:**
- Create: `src/components/landing/timesheet-showcase.tsx`

**Interfaces:**
- Produces: `export function TimesheetShowcase(): JSX.Element`

- [ ] **Step 1: Implement TimesheetShowcase component**
Create `src/components/landing/timesheet-showcase.tsx` with:
- Interactive Mon–Fri Tempo attestation strip simulator:
  - Click days Mon through Fri to mark Tempo logged.
  - Submitting unlocked only once all 5 days are checked.
  - Submit & Unsubmit state transition demo.
- **AutoTempo Rule Engine visualizer:**
  - Configurable categories (BAU, Capitalized Dev, Vacation, Bank Holidays).
  - One-click rule simulation that pre-fills timesheets based on user rules.

- [ ] **Step 2: Commit Task 5**
```bash
git add src/components/landing/timesheet-showcase.tsx
git commit -m "feat(landing): add timesheet and autotempo showcase component"
```

---

### Task 6: Analytics, Velocity & Loose Ends Showcase (`analytics-showcase.tsx`)

**Files:**
- Create: `src/components/landing/analytics-showcase.tsx`

**Interfaces:**
- Produces: `export function AnalyticsShowcase(): JSX.Element`

- [ ] **Step 1: Implement AnalyticsShowcase component**
Create `src/components/landing/analytics-showcase.tsx` with:
- High-signal metric cards:
  - **Throughput & Velocity Delta:** Completed work vs rolling averages.
  - **Milestone Cycle Times:** Visual bar breakdown (Dev vs Staging vs QA).
  - **Loose Ends Radar:** Interactive callout showing lingering unverified items or open PRs before release.

- [ ] **Step 2: Commit Task 6**
```bash
git add src/components/landing/analytics-showcase.tsx
git commit -m "feat(landing): add velocity and loose ends analytics showcase component"
```

---

### Task 7: Theme & Typography Live Showcase (`theme-showcase.tsx`)

**Files:**
- Create: `src/components/landing/theme-showcase.tsx`

**Interfaces:**
- Produces: `export function ThemeShowcase(): JSX.Element`

- [ ] **Step 1: Implement ThemeShowcase component**
Create `src/components/landing/theme-showcase.tsx` with:
- Live palette switcher showcasing all 4 Waypoint colorways:
  - Paper (Warm sepia & amber)
  - Nordic Frost (Cool slate & cyan)
  - Forest Sage (Pine & emerald)
  - Royal Plum (Amethyst & violet)
- Live typography preview (Newsreader Serif, System Sans, IBM Plex Mono).
- Light / Dark mode toggle demo.

- [ ] **Step 2: Commit Task 7**
```bash
git add src/components/landing/theme-showcase.tsx
git commit -m "feat(landing): add theme and typography showcase component"
```

---

### Task 8: Comparison Matrix & Developer FAQ (`comparison-table.tsx` & `faq-section.tsx`)

**Files:**
- Create: `src/components/landing/comparison-table.tsx`
- Create: `src/components/landing/faq-section.tsx`

**Interfaces:**
- Produces: `export function ComparisonTable(): JSX.Element`
- Produces: `export function FaqSection(): JSX.Element`

- [ ] **Step 1: Implement ComparisonTable component**
Create `src/components/landing/comparison-table.tsx` comparing Waypoint vs Jira/Linear vs Spreadsheets.

- [ ] **Step 2: Implement FaqSection component**
Create `src/components/landing/faq-section.tsx` with interactive expandable accordion for key developer questions.

- [ ] **Step 3: Commit Task 8**
```bash
git add src/components/landing/comparison-table.tsx src/components/landing/faq-section.tsx
git commit -m "feat(landing): add comparison matrix and developer FAQ components"
```

---

### Task 9: Assemble Feature-Rich Landing Page (`src/app/page.tsx`)

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: All landing components created in Tasks 1–8.

- [ ] **Step 1: Assemble full landing page in `src/app/page.tsx`**
Update `src/app/page.tsx` to compose:
- Sticky/clean header with Logo, Navigation Links (Features, How it Works, Docs, llms.txt, GitHub), Theme switcher, and Auth CTAs.
- Hero Section with Eyebrow, Punchy Headline, Value proposition, Dual CTAs, and `InteractivePipelineDemo`.
- 6 Feature Deep-Dive Sections with rich visual rhythm, alternating grid layouts, and clean typographic hierarchy.
- "Why Waypoint?" Comparison Section.
- Interactive Theme & Typography Sandbox.
- Developer FAQ Accordion.
- Bottom CTA Banner with direct signup links.
- Rich Footer with full site links and privacy assurance.

- [ ] **Step 2: Verify Build & Accessibility**
Run `pnpm build` (or `npm run build`) to ensure 0 TypeScript/ESLint errors and successful static page generation.

- [ ] **Step 3: Commit Task 9**
```bash
git add src/app/page.tsx
git commit -m "feat(landing): assemble full feature-rich landing page"
```

---

## Plan Verification

- **Automated Check:** Run `npm run build` or `pnpm build` to verify clean compilation.
- **Manual Check:** Verify interactive state transitions for hero pipeline, code tabs, timesheet strip, theme preview, and FAQ accordion.
