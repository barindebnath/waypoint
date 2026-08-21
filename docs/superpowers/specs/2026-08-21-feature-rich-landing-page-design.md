# Feature-Rich Landing Page Design Specification

**Date:** 2026-08-21  
**Status:** Approved  
**Author:** UI/UX Tech Lead  

---

## 1. Overview & Vision

Waypoint is an external memory and personal status tracker for developers who ship. Rather than replacing Jira, GitHub, or Tempo, Waypoint acts as a clean, deterministic mirror of active work units with zero customer data leakage.

This design upgrades the current minimal landing page (`src/app/page.tsx`) into a showcase of all platform features. It combines Waypoint's distinctive "paper & lamplight" editorial aesthetic with live, hands-on interactive widgets that let developers experience the product before signing up.

---

## 2. Core Structure & Content Architecture

### 2.1 Navigation Bar
- **Brand Identity:** Waypoint Logo with customizable theme indicator.
- **Quick Links:** Features, How It Works, Docs (`/docs`), `llms.txt` (`/llms.txt`), GitHub.
- **Actions:** Theme Toggle (Light/Dark), "Sign In" link, and "Get Started" CTA button.

### 2.2 Hero Section & Interactive Pipeline Sandbox
- **Header Eyebrow:** `PERSONAL STATUS TRACKER & EXTERNAL MEMORY`
- **Headline:** *"External memory for a developer who ships."*
- **Subtitle:** *"One row per unit of work moving through fixed milestone pipelines. Updated by your AI, synced with GitHub & Jira, with zero customer data stored."*
- **CTAs:** 
  - Primary: `Start tracking free →` (routes to `/signup`)
  - Secondary: `Read the docs` (routes to `/docs`)
  - Tertiary: `View llms.txt` (routes to `/llms.txt`)
- **Interactive Sandbox Component (`interactive-pipeline-demo.tsx`):**
  - Live interactive row (`ZT-4821` Support Bug + `PES-1032` Jira Card + `web-client#142` PR).
  - 5 interactive milestone steps: *Triage & Setup*, *Development*, *Staging*, *QA & Review*, *Production & Close-out*.
  - Sub-task checklist popovers/accordion: visitors can toggle items like *Root cause identified*, *PR raised*, *CI checks passing*, *Staging smoke test*.
  - Milestones auto-advance and fill connection lines in real-time as sub-tasks complete.
  - Interactive actions: "Fast-complete" all remaining tasks, "Regress to Development", and "Reset Demo".

---

### 2.3 Six Core Feature Deep-Dive Modules

#### Feature 1: Deterministic Pipelines & Refs-Only Architecture
- **Concept:** Work units are immutable pipelines with strict forward progression and explicit, destructive regressions.
- **Interactive Pipeline Family Switcher (`pipeline-family-showcase.tsx`):**
  - `support_full` (5 milestones: Triage → Dev → Staging → QA → Prod)
  - `support_light` (3 milestones: Triage → Resolution → Close-out for data fixes/DB queries)
  - `feature` (5 milestones: Definition → Dev → Staging → QA → Prod)
- **Zero-Content Privacy Guarantee:**
  - Explicit explanation of Why Refs Only: Cards store only pointers (`ZT-1234`, `OFF-5678`), never descriptions or customer data.

#### Feature 2: AI Agent & LLM Native (`/llms.txt`)
- **Concept:** Designed from day one to be driven by pair-programming agents (Cursor, Claude Code, Windsurf, AGY, CLI agents).
- **Interactive Snippet Switcher (`ai-agent-showcase.tsx`):**
  - **Tab 1: Natural Language Agent Prompt:** *"I just raised PR #42 for ZT-4821 and verified the fix in staging."*
  - **Tab 2: Deterministic API Write:** `POST /api/v1/rows/ZT-4821/subtasks` with `Idempotency-Key` headers.
  - **Tab 3: `llms.txt` Live Context:** Machine-readable agent prompt served directly at `/llms.txt`.
- **Key Highlights:** Personal access tokens (`read`, `read,write`), replay-safe idempotency keys, sub-10ms API latency.

#### Feature 3: Live GitHub & Jira Real-Time Status Sync
- **Concept:** Waypoint connects directly to GitHub and Jira to reflect PR review states and ticket movements automatically.
- **Interactive Badges Preview (`integrations-showcase.tsx`):**
  - GitHub PR Badges: Open (`#42`), Draft, Checks Passing, Approved, Merged.
  - Jira Status Badges: In Progress, In Review, Staging QA, Done.
  - Background fan-out sync across all active cards via `/api/v1/integrations/sync`.

#### Feature 4: Weekly Timesheet & AutoTempo Engine
- **Concept:** Eliminate end-of-week timesheet panic with lightweight daily attestation and automated rule-based logging.
- **Interactive Timesheet Demo (`timesheet-showcase.tsx`):**
  - Mon–Fri clickable attestation strip with live submission lock/unlock state.
  - AutoTempo rule simulator: Preview how rules (BAU, Capitalized Projects, Vacation, Sick Leave, Bank Holidays) auto-log time.

#### Feature 5: Velocity, Cycle Times & "Loose Ends" Analytics
- **Concept:** High-signal developer analytics without toxic micrometrics.
- **Analytics Visual Preview (`analytics-showcase.tsx`):**
  - **Throughput & Velocity Delta:** Weekly throughput trends vs historical averages.
  - **Milestone Cycle Time:** Visual breakdown of time spent in Dev vs Staging vs QA.
  - **Loose Ends Radar:** Highlights neglected PRs, abandoned sub-tasks, and lingering tickets before releases.

#### Feature 6: Handcrafted Design System & Themes
- **Concept:** "Paper & Lamplight" editorial aesthetic with first-class theme and font customization.
- **Interactive Theme & Typography Switcher (`theme-showcase.tsx`):**
  - 4 Palettes: **Paper** (warm sepia), **Nordic Frost** (slate blue), **Forest Sage** (pine green), **Royal Plum** (deep purple).
  - Full Light and Dark mode parity.
  - Typography options: **Newsreader Serif**, **System Sans**, **IBM Plex Mono**.
  - Local-first privacy: 0 telemetry trackers, instant JSON data export.

---

### 2.4 "Why Waypoint?" Comparison Matrix
| Feature | Waypoint | Jira / Linear | Spreadsheets / Notion |
| :--- | :--- | :--- | :--- |
| **Data Model** | Deterministic pipeline + subtasks | Complex custom workflows | Freeform unstructured text |
| **Privacy & Security** | References only (0 customer data) | Full card & customer contents stored | Unrestricted text / credentials risk |
| **AI Agent Native** | Live `/llms.txt` + Idempotent API | Heavy GraphQL / OAuth setups | Manual copy-pasting |
| **Sync Speed** | Sub-10ms mirror updates | Slow multi-tenant polling | Manual updates |
| **Timesheet / Tempo** | Built-in 5-day attestation + AutoTempo | Separate third-party add-on | Manual end-of-week reconciliation |
| **Distraction Level** | Zero comments, zero notifications | High notification noise | High formatting overhead |

---

### 2.5 Developer FAQ & Bottom CTA Section
- Common questions addressed:
  - *How does Waypoint keep customer data safe?*
  - *How do AI tools like Claude Code or Cursor integrate with Waypoint?*
  - *Can I use Waypoint if my team uses both Jira and GitHub?*
  - *How does AutoTempo handle bank holidays and vacation days?*
- Final high-impact CTA banner driving sign-ups and documentation exploration.

---

## 3. Technical Architecture & File Organization

```
src/
├── app/
│   └── page.tsx                         # Main Server Component (SSR + metadata + structured sections)
└── components/
    └── landing/
        ├── interactive-pipeline-demo.tsx # Hero live interactive pipeline simulator
        ├── pipeline-family-showcase.tsx  # Interactive Support Full / Light / Feature explorer
        ├── ai-agent-showcase.tsx         # Code & prompt tabs preview
        ├── integrations-showcase.tsx     # Jira & GitHub PR live status cards
        ├── timesheet-showcase.tsx        # Interactive 5-day Tempo attestation demo
        ├── analytics-showcase.tsx        # Cycle time & loose ends visual cards
        ├── theme-showcase.tsx            # Live palette & font preview widget
        ├── comparison-table.tsx          # Waypoint vs Jira vs Spreadsheets matrix
        └── faq-section.tsx               # Expandable developer FAQ accordion
```

---

## 4. Verification & Quality Gates
- **Accessibility & Contrast:** Ensure all color swatches, buttons, and text maintain WCAG AA contrast in both light and dark modes.
- **Responsiveness:** Test on mobile (360px–480px), tablet (768px–1024px), and desktop (1280px+).
- **Zero Flash:** Preserve theme synchronization with Next.js SSR and client-side theme variables.
- **Clean Build:** Run `pnpm build` or `next build` to verify no lint errors or hydration mismatches.
