import type { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Chip } from "@/components/chip";
import { ArrowUpRightIcon } from "@/components/icons";
import { LogoTile } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { btnGhost, btnPrimary, btnSecondary } from "@/components/ui";
import { BoardShowcase } from "@/components/landing/board-showcase";
import { PipelineFamilyShowcase } from "@/components/landing/pipeline-family-showcase";
import { AiAgentShowcase } from "@/components/landing/ai-agent-showcase";
import { IntegrationsShowcase } from "@/components/landing/integrations-showcase";
import { TimesheetShowcase } from "@/components/landing/timesheet-showcase";
import { AnalyticsShowcase } from "@/components/landing/analytics-showcase";
import { ThemeShowcase } from "@/components/landing/theme-showcase";
import { ComparisonTable } from "@/components/landing/comparison-table";
import { FaqSection } from "@/components/landing/faq-section";
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
  GitPullRequestIcon,
  CalendarIcon,
  BarChart3Icon,
  PaletteIcon,
  CheckIcon,
} from "@/components/landing/icons";

export const metadata = {
  title: "Waypoint — external memory for a developer who ships",
  description:
    "A personal status tracker your AI updates for you: deterministic milestone pipelines, GitHub/Jira auto-sync, weekly Tempo timesheets, and zero customer data stored.",
};

const INTEGRATION_PILLS = [
  { name: "Claude Code", category: "AI Pair" },
  { name: "Cursor", category: "IDE" },
  { name: "Windsurf", category: "IDE" },
  { name: "Antigravity", category: "Agent" },
  { name: "GitHub", category: "Code & PRs" },
  { name: "Jira", category: "Tracking" },
  { name: "Tempo", category: "Timesheet" },
];

/** The anchors of the sections on this page. The Docs link follows them in the header. */
const NAV_ANCHORS = [
  { href: "#pipelines", label: "Pipelines" },
  { href: "#ai-agent", label: "AI / llms.txt" },
  { href: "#integrations", label: "Integrations" },
  { href: "#timesheet", label: "Timesheet" },
  { href: "#analytics", label: "Analytics" },
  { href: "#themes", label: "Themes" },
];

/* Shared classes. The page is a desk with big rounded panels on it, as the app is. */

/** A big panel on the desk. Every section of the page uses it. */
const PANEL = "rounded-panel bg-bg p-5 sm:p-10";
/** The heading of a section. */
const H2 = "text-balance font-serif text-[32px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[40px]";
/** The text under a heading. */
const BODY = "text-[15px] leading-relaxed text-ink-muted";
/** A link in the header bar. A text colour class wins over the default accent colour of a link. */
const NAV_LINK =
  "whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink xl:px-3";
/** A link in the footer bar. */
const FOOTER_LINK =
  "inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink";

/** A short piece of code inside a line of text. */
function Code({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[12.5px] text-ink">{children}</code>;
}

/** The small label above a heading: an icon on a soft lime circle, then the text. */
function Eyebrow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent-fg">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      {children}
    </p>
  );
}

/**
 * One feature section: a text column and a showcase, in a panel.
 * On a wide screen `reverse` puts the showcase on the left. On a narrow screen the text is always first.
 */
function FeatureSection({
  id,
  icon,
  eyebrow,
  title,
  intro,
  points,
  showcase,
  reverse = false,
}: {
  id: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  intro: ReactNode;
  points: ReactNode[];
  showcase: ReactNode;
  reverse?: boolean;
}) {
  return (
    <section id={id} className={`scroll-mt-24 ${PANEL}`}>
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
        <div className={`min-w-0 space-y-5 lg:col-span-5 ${reverse ? "lg:order-2" : ""}`}>
          <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
          <h2 className={H2}>{title}</h2>
          <p className={BODY}>{intro}</p>
          <ul className="space-y-3 pt-1 text-sm leading-relaxed text-ink-muted">
            {points.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-fg">
                  <CheckIcon className="h-3 w-3" />
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={`min-w-0 lg:col-span-7 ${reverse ? "lg:order-1" : ""}`}>{showcase}</div>
      </div>
    </section>
  );
}

export default async function LandingPage() {
  // Signed-in users land straight in the app.
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/board");

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-desk text-ink selection:bg-accent selection:text-accent-ink">
      {/* Header: a floating bar on the desk. Below the sm size the words of the brand are only for screen readers. */}
      <header className="sticky top-0 z-40 px-2.5 pt-2.5 sm:px-5 sm:pt-4">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-3 rounded-2xl bg-bg p-2 shadow-card ring-1 ring-edge sm:px-3.5">
          <div className="flex min-w-0 items-center gap-3 min-[1100px]:gap-6">
            <Link href="/" className="group flex items-center gap-2.5 text-ink">
              <LogoTile className="h-9 w-9 transition-transform group-hover:scale-105" />
              <span className="sr-only font-serif text-[19px] font-semibold tracking-tight sm:not-sr-only">Waypoint</span>
            </Link>

            <nav aria-label="Sections" className="hidden items-center gap-0.5 min-[1100px]:flex">
              {NAV_ANCHORS.map((item) => (
                <a key={item.href} href={item.href} className={NAV_LINK}>
                  {item.label}
                </a>
              ))}
              <Link href="/docs" className={NAV_LINK}>
                Docs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href="/llms.txt"
              className="hidden items-center gap-2 rounded-full bg-surface-2 px-3.5 py-2 font-mono text-xs text-ink-muted ring-1 ring-edge transition-colors hover:bg-surface-3 hover:text-ink xl:inline-flex"
            >
              <span className="h-1.5 w-1.5 animate-live rounded-full bg-accent" />
              <span>/llms.txt</span>
            </a>
            <Link href="/login" className={btnGhost}>
              Sign in
            </Link>
            <Link href="/signup" className={btnPrimary}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Body: a stack of panels on the desk */}
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-2.5 pb-3 pt-3 sm:gap-4 sm:px-5 sm:pt-4">
        {/* HERO */}
        <section className="rounded-panel bg-bg">
          <div className="mx-auto max-w-[880px] space-y-6 px-5 pb-10 pt-14 text-center sm:px-10 sm:pb-12 sm:pt-20">
            <p className="inline-flex h-8 items-center gap-2 rounded-full bg-accent-soft px-3.5 text-[12.5px] font-semibold text-accent-fg">
              <span className="h-1.5 w-1.5 animate-live rounded-full bg-accent" />
              <span>Personal Status Tracker &amp; External Memory</span>
            </p>

            <h1 className="mx-auto max-w-[820px] text-balance font-serif text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-[56px] lg:text-[68px]">
              External memory for a developer who ships.
            </h1>

            <p className="mx-auto max-w-[640px] text-pretty text-base leading-relaxed text-ink-muted">
              One card per unit of work, moving across a Board of fixed milestone columns. Updated by your AI, synced with GitHub &amp; Jira, with zero customer data stored.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/signup" className={btnPrimary}>
                <span>Start tracking free</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/docs" className={btnSecondary}>
                Read the docs
              </Link>
              <a href="/llms.txt" className={`${btnSecondary} font-mono`}>
                llms.txt
              </a>
            </div>

            {/* Social Proof / Ecosystem Strip */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Pairs with:</span>
              {INTEGRATION_PILLS.map((pill) => (
                <Chip key={pill.name} tone="ghost">
                  {pill.name}
                </Chip>
              ))}
            </div>
          </div>

          {/* Hero preview: the real Board with sample data, in a window */}
          <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3">
            <BoardShowcase />
          </div>
        </section>

        {/* 1. DETERMINISTIC PIPELINES (2-Column) */}
        <FeatureSection
          id="pipelines"
          icon={<ShieldCheckIcon />}
          eyebrow="Deterministic Pipelines"
          title="Fixed Milestone Flows. Zero Ambiguity."
          intro="Work moves strictly through immutable milestone sequences. You or your AI reports real events; the server calculates progress."
          points={[
            <><strong className="font-semibold text-ink">3 Specialized Pipelines:</strong> Support Full (Bugs), Support Light (Tasks/DB queries), and Product Features.</>,
            <><strong className="font-semibold text-ink">References Only:</strong> Stores card pointers (<Code>ZT-4821</Code>), never customer text or secret credentials.</>,
            <><strong className="font-semibold text-ink">Explicit Regressions:</strong> Clear milestones destructively only on demand when fixes are rejected.</>,
          ]}
          showcase={<PipelineFamilyShowcase />}
        />

        {/* 2. AI AGENT & LLM NATIVE (2-Column Reversed) */}
        <FeatureSection
          id="ai-agent"
          reverse
          icon={<SparklesIcon />}
          eyebrow="Pair-Programming Native"
          title="Built for Your AI Pair Engineer."
          intro={
            <>
              Point Claude Code, Cursor, Windsurf, or Antigravity at <Code>/llms.txt</Code>. With a personal access token, your agent mirrors PRs, branches, and card states in milliseconds.
            </>
          }
          points={[
            <><strong className="font-semibold text-ink">Live /llms.txt:</strong> Self-documenting prompt rules delivered dynamically on the root host.</>,
            <><strong className="font-semibold text-ink">Deterministic Idempotency:</strong> Safe retry mechanics with <Code>Idempotency-Key</Code> headers.</>,
          ]}
          showcase={<AiAgentShowcase />}
        />

        {/* 3. JIRA & GITHUB SYNC (2-Column) */}
        <FeatureSection
          id="integrations"
          icon={<GitPullRequestIcon />}
          eyebrow="Bi-Directional Awareness"
          title="Live GitHub PR & Jira Status Sync."
          intro="Connect Jira and GitHub, and every card shows its Jira status and title, and its PR: line changes, review state, conflicts, and unresolved threads. The Board syncs every 30 minutes."
          points={[
            <><strong className="font-semibold text-ink">Background Fan-out Sync:</strong> Updates all active cards concurrently with zero polling overhead.</>,
            <><strong className="font-semibold text-ink">Non-Destructive:</strong> Reads external states to advance your memory without altering external repos.</>,
          ]}
          showcase={<IntegrationsShowcase />}
        />

        {/* 4. TIMESHEET & AUTOTEMPO (2-Column Reversed) */}
        <FeatureSection
          id="timesheet"
          reverse
          icon={<CalendarIcon />}
          eyebrow="Tempo Timesheet Peace"
          title="Timesheets & AutoTempo."
          intro="Never reconstruct your week on Friday afternoon. A one-row timesheet bar sits at the bottom of the Board, and one click on Fill lets AutoTempo log the missing days to official investment accounts."
          points={[
            <><strong className="font-semibold text-ink">1-Click Fill:</strong> AutoTempo finds the last filled day in Tempo and fills every day after it, up to today.</>,
            <><strong className="font-semibold text-ink">Official Investment Categorization:</strong> Capitalized development vs BAU Support account mapping.</>,
            <><strong className="font-semibold text-ink">Bank Holidays & Skip Days:</strong> Automatically accounts for non-working days.</>,
          ]}
          showcase={<TimesheetShowcase />}
        />

        {/* 5. VELOCITY & FLOW ANALYTICS (2-Column) */}
        <FeatureSection
          id="analytics"
          icon={<BarChart3Icon />}
          eyebrow="Flow Analytics"
          title="Velocity, Cycle Times & Loose Ends Radar."
          intro="Track throughput and milestone cycle times from intake to canary release. Identify staging bottlenecks and catch neglected PRs before they delay your sprint."
          points={[
            <><strong className="font-semibold text-ink">Cycle-Time Bottlenecks:</strong> Breakdown of days spent in Triage vs Dev vs Staging vs QA.</>,
            <><strong className="font-semibold text-ink">Loose Ends Radar:</strong> Flags cards whose final milestone is done but contain unchecked sub-tasks.</>,
          ]}
          showcase={<AnalyticsShowcase />}
        />

        {/* 6. THE CHARCOAL & LIME LOOK AND THE PALETTES */}
        <section id="themes" className={`scroll-mt-24 ${PANEL}`}>
          <div className="mx-auto max-w-3xl space-y-5 text-center">
            <Eyebrow icon={<PaletteIcon />}>Charcoal &amp; Lime</Eyebrow>
            <h2 className={H2}>Charcoal Panels. One Lime Accent.</h2>
            <p className={BODY}>
              Waypoint looks like a dark dashboard: charcoal panels on a near-black desk, round corners, soft icons, and one lime accent. Choose from 4 handcrafted colour palettes with light and dark mode, plus your own typography.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-[920px] sm:mt-10">
            <ThemeShowcase />
          </div>
        </section>

        {/* 7. COMPARISON MATRIX */}
        <section className={PANEL}>
          <div className="mx-auto max-w-xl space-y-3 text-center">
            <h2 className={H2}>How Waypoint Compares</h2>
            <p className={BODY}>
              Waypoint is not another heavy project management board — it is your personal developer cockpit.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-5xl sm:mt-10">
            <ComparisonTable />
          </div>
        </section>

        {/* 8. DEVELOPER FAQ */}
        <section id="faq" className={`scroll-mt-24 ${PANEL}`}>
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <h2 className={H2}>Frequently Asked Questions</h2>
            <p className={BODY}>Architecture, security, privacy, and developer pair workflows.</p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl sm:mt-10">
            <FaqSection />
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="rounded-panel bg-bg px-5 py-14 text-center sm:px-10 sm:py-20">
          <div className="mx-auto max-w-xl space-y-5">
            <LogoTile className="mx-auto h-14 w-14" />
            <h2 className={H2}>Ready to give your work external memory?</h2>
            <p className="mx-auto max-w-md text-[15px] leading-relaxed text-ink-muted">
              Create an account in seconds. Point your AI pair at <Code>/llms.txt</Code> and never lose track of a card, PR, or timesheet again.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/signup" className={btnPrimary}>
                <span>Get started free</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/docs" className={btnSecondary}>
                Explore API reference
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer: a floating bar, like the header */}
      <footer className="mt-auto px-2.5 pb-2.5 pt-1 sm:px-5 sm:pb-4">
        <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-3 rounded-2xl bg-bg px-5 py-4 text-xs text-ink-faint sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <LogoTile className="h-8 w-8" />
            <span className="font-serif text-[15px] font-semibold text-ink">Waypoint</span>
            <span>— external memory for developers</span>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-1">
            <a href="/llms.txt" className={FOOTER_LINK}>
              /llms.txt
            </a>
            <Link href="/docs" className={FOOTER_LINK}>
              Docs
            </Link>
            <Link href="/privacy" className={FOOTER_LINK}>
              Privacy: References Only
            </Link>
            <a
              href="https://github.com/barindebnath/waypoint"
              target="_blank"
              rel="noreferrer noopener"
              className={FOOTER_LINK}
            >
              GitHub
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
