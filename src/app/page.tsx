import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { InteractivePipelineDemo } from "@/components/landing/interactive-pipeline-demo";
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
  CheckCircleIcon,
} from "@/components/landing/icons";

export const metadata = {
  title: "Waypoint — external memory for a developer who ships",
  description:
    "A personal status tracker your AI updates for you: deterministic milestone pipelines, GitHub/Jira auto-sync, weekly Tempo timesheets, and zero customer data stored.",
};

export default async function LandingPage() {
  // Signed-in users land straight in the app.
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-bg text-ink">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-[3px] border-double border-edge-strong bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between px-6 py-3.5 sm:px-8">
          <div className="flex items-center gap-7">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="h-6 w-6 -mt-0.5" />
              <span className="font-serif text-[21px] font-semibold tracking-tight">Waypoint</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-6 text-[13px] text-ink-muted">
              <a href="#pipelines" className="hover:text-ink transition">
                Pipelines
              </a>
              <a href="#ai-agent" className="hover:text-ink transition">
                AI / llms.txt
              </a>
              <a href="#integrations" className="hover:text-ink transition">
                Integrations
              </a>
              <a href="#timesheet" className="hover:text-ink transition">
                Timesheet
              </a>
              <a href="#analytics" className="hover:text-ink transition">
                Analytics
              </a>
              <a href="#themes" className="hover:text-ink transition">
                Themes
              </a>
              <Link href="/docs" className="hover:text-ink transition">
                Docs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a
              href="/llms.txt"
              className="hidden sm:inline-block rounded-md border border-edge bg-surface-2 px-2.5 py-1 text-xs font-mono text-ink-muted hover:border-edge-strong hover:text-ink transition"
            >
              /llms.txt
            </a>
            <Link href="/login" className="text-[13px] text-ink-muted hover:text-ink transition px-2">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-accent px-4 py-1.5 text-[13px] font-semibold text-accent-ink hover:opacity-90 transition shadow-xs"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="mx-auto w-full max-w-[1160px] px-6 sm:px-8 pb-24 pt-10 sm:pt-16 space-y-28">
        {/* HERO */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3.5 py-1 font-mono text-[11.5px] font-semibold uppercase tracking-wider text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-live" />
            <span>Personal Status Tracker</span>
          </div>

          <h1 className="mx-auto max-w-[840px] font-serif text-4xl sm:text-6xl font-medium leading-[1.08] tracking-tight text-balance">
            External memory for a developer who ships.
          </h1>

          <p className="mx-auto max-w-[640px] text-pretty text-base sm:text-lg leading-relaxed text-ink-muted">
            One row per unit of work, moving through fixed milestone pipelines. Updated by your AI, synced with GitHub & Jira, with zero customer data stored.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-ink hover:opacity-90 transition shadow-card"
            >
              <span>Start tracking free</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="rounded-xl border border-edge bg-surface px-6 py-3 text-sm font-medium text-ink hover:bg-surface-2 transition shadow-2xs"
            >
              Read the docs
            </Link>
            <a
              href="/llms.txt"
              className="rounded-xl border border-edge bg-surface-2 px-4 py-3 text-sm font-mono text-ink-muted hover:text-ink transition"
            >
              llms.txt
            </a>
          </div>

          {/* Interactive Hero Sandbox */}
          <div className="pt-6">
            <InteractivePipelineDemo />
          </div>
        </section>

        {/* 1. DETERMINISTIC PIPELINES (2-Column) */}
        <section id="pipelines" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                <ShieldCheckIcon className="h-4 w-4" />
                <span>Deterministic Pipelines</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                Fixed Milestone Flows. Zero Ambiguity.
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                Work moves strictly through immutable milestone sequences. You or your AI reports real events; the server calculates progress.
              </p>
              <ul className="space-y-2.5 text-xs text-ink-muted pt-2">
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-done-soft text-done flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                  <span><strong>3 Specialized Pipelines:</strong> Support Full (Bugs), Support Light (Tasks/DB queries), and Product Features.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-done-soft text-done flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                  <span><strong>References Only:</strong> Stores card pointers (<code>ZT-4821</code>), never customer text or secret credentials.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-done-soft text-done flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                  <span><strong>Explicit Regressions:</strong> Clear milestones destructively only on demand when fixes are rejected.</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7">
              <PipelineFamilyShowcase />
            </div>
          </div>
        </section>

        {/* 2. AI AGENT & LLM NATIVE (2-Column Reversed) */}
        <section id="ai-agent" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <AiAgentShowcase />
            </div>

            <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                <SparklesIcon className="h-4 w-4" />
                <span>Pair-Programming Native</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                Built for Your AI Pair Engineer.
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                Point Claude Code, Cursor, Windsurf, or Antigravity at <code className="text-accent">/llms.txt</code>. With a personal access token, your agent mirrors PRs, branches, and card states in milliseconds.
              </p>
              <ul className="space-y-2.5 text-xs text-ink-muted pt-2">
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-done-soft text-done flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                  <span><strong>Live /llms.txt:</strong> Self-documenting prompt rules delivered dynamically on the root host.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-done-soft text-done flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                  <span><strong>Deterministic Idempotency:</strong> Safe retry mechanics with <code>Idempotency-Key</code> headers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-done-soft text-done flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                  <span><strong>humanUsual Safeguard:</strong> Testing and deploys wait for human confirmation — zero hallucinated ticks.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. JIRA & GITHUB SYNC (2-Column) */}
        <section id="integrations" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                <GitPullRequestIcon className="h-4 w-4" />
                <span>Bi-Directional Awareness</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                Live GitHub PR & Jira Status Sync.
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                Connect your Jira projects and GitHub repositories to automatically reflect PR states (open, checks passing, approved, merged) and board transitions into your status bar.
              </p>
              <ul className="space-y-2.5 text-xs text-ink-muted pt-2">
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-done-soft text-done flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                  <span><strong>Background Fan-out Sync:</strong> Updates all active cards concurrently with zero polling overhead.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-done-soft text-done flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                  <span><strong>Non-Destructive:</strong> Reads external states to advance your memory without altering external repos.</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7">
              <IntegrationsShowcase />
            </div>
          </div>
        </section>

        {/* 4. TIMESHEET & AUTOTEMPO (2-Column Reversed) */}
        <section id="timesheet" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <TimesheetShowcase />
            </div>

            <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                <CalendarIcon className="h-4 w-4" />
                <span>Tempo Timesheet Peace</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                Weekly Tempo Attestation & AutoTempo.
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                Never reconstruct your week on Friday afternoon. A lightweight 5-day attestation strip (Mon–Fri) plus an intelligent AutoTempo engine that maps work to official investment accounts.
              </p>
              <ul className="space-y-2.5 text-xs text-ink-muted pt-2">
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-done-soft text-done flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                  <span><strong>1-Click Daily Attestation:</strong> Ticking a day confirms Tempo logging is done.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-done-soft text-done flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                  <span><strong>Official Investment Categorization:</strong> Capitalized development vs BAU Support account mapping.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-done-soft text-done flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                  <span><strong>Bank Holidays & Skip Days:</strong> Automatically accounts for non-working days.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 5. VELOCITY & FLOW ANALYTICS (2-Column) */}
        <section id="analytics" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                <BarChart3Icon className="h-4 w-4" />
                <span>Flow Analytics</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                Velocity, Cycle Times & Loose Ends Radar.
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                Track throughput and milestone cycle times from intake to canary release. Identify staging bottlenecks and catch neglected PRs before they delay your sprint.
              </p>
              <ul className="space-y-2.5 text-xs text-ink-muted pt-2">
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-done-soft text-done flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                  <span><strong>Cycle-Time Bottlenecks:</strong> Breakdown of days spent in Triage vs Dev vs Staging vs QA.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-done-soft text-done flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                  <span><strong>Loose Ends Radar:</strong> Flags rows whose final milestone is done but contain unchecked sub-tasks.</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7">
              <AnalyticsShowcase />
            </div>
          </div>
        </section>

        {/* 6. CRAFTED THEMES & AESTHETICS */}
        <section id="themes" className="scroll-mt-24 space-y-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
            <PaletteIcon className="h-4 w-4" />
            <span>Paper & Lamplight</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
            Editorial Craft & Handcrafted Themes.
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Designed with the tactile elegance of fine stationery. 4 handcrafted color palettes with complete Light and Dark mode parity, plus typography customization.
          </p>

          <div className="pt-4 text-left">
            <ThemeShowcase />
          </div>
        </section>

        {/* 7. COMPARISON MATRIX */}
        <section className="space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              How Waypoint Compares
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Waypoint is not another heavy project management board — it is your personal developer cockpit.
            </p>
          </div>

          <ComparisonTable />
        </section>

        {/* 8. DEVELOPER FAQ */}
        <section id="faq" className="scroll-mt-24 space-y-6 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Architecture, security, privacy, and developer pair workflows.
            </p>
          </div>

          <FaqSection />
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="rounded-2xl border border-edge bg-surface-2 p-8 sm:p-14 text-center shadow-card space-y-5">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink max-w-lg mx-auto">
            Ready to give your work external memory?
          </h2>
          <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
            Create an account in seconds. Point your AI pair at <code className="text-accent font-mono font-semibold">/llms.txt</code> and never lose track of a card, PR, or timesheet again.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-ink hover:opacity-90 transition shadow-card"
            >
              <span>Get started free</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="rounded-xl border border-edge bg-surface px-6 py-3 text-sm font-medium text-ink hover:bg-surface-3/50 transition shadow-2xs"
            >
              Explore API reference
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-edge bg-surface">
        <div className="mx-auto flex max-w-[1160px] flex-col sm:flex-row items-center justify-between gap-4 px-6 sm:px-8 py-6 text-xs text-ink-faint">
          <div className="flex items-center gap-2.5">
            <Logo className="h-5 w-5 opacity-70" />
            <span className="font-serif font-semibold text-ink">Waypoint</span>
            <span>— external memory for developers</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-ink-muted">
            <a href="/llms.txt" className="hover:text-ink transition">
              /llms.txt
            </a>
            <Link href="/docs" className="hover:text-ink transition">
              Docs
            </Link>
            <Link href="/privacy" className="hover:text-ink transition">
              Privacy: References Only
            </Link>
            <a
              href="https://github.com/barindebnath/waypoint"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-ink transition"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
