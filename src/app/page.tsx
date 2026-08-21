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
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b-[3px] border-double border-edge-strong bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-3.5 sm:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="h-6 w-6 -mt-0.5" />
              <span className="font-serif text-[21px] font-semibold tracking-tight">Waypoint</span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-[13px] text-ink-muted">
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
              className="rounded-lg bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-accent-ink hover:opacity-90 transition shadow-xs"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] px-6 sm:px-8 pb-24 pt-12 sm:pt-16">
        {/* HERO SECTION */}
        <section className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3.5 py-1 font-mono text-[11.5px] font-semibold uppercase tracking-wider text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-live" />
            <span>External Memory for Developers</span>
          </div>

          <h1 className="mx-auto max-w-[820px] font-serif text-4xl sm:text-6xl font-medium leading-[1.08] tracking-tight text-balance">
            External memory for a developer who ships.
          </h1>

          <p className="mx-auto max-w-[620px] text-pretty text-base sm:text-lg leading-relaxed text-ink-muted">
            One row per unit of work moving through a fixed milestone pipeline. Updated by your AI, synced with GitHub & Jira, with zero customer data stored.
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
              className="rounded-xl border border-edge-strong bg-surface px-6 py-3 text-sm font-medium text-ink hover:bg-surface-2 transition"
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

          {/* Interactive Live Hero Pipeline Sandbox */}
          <div className="pt-8">
            <InteractivePipelineDemo />
          </div>
        </section>

        {/* FEATURE 1: DETERMINISTIC PIPELINES */}
        <section id="pipelines" className="pt-24 space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent font-mono">
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Deterministic Flow</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              Fixed Milestone Pipelines. Zero Ambiguity.
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Work moves strictly through immutable milestone sequences. You report real events; the server calculates progress.
            </p>
          </div>

          <PipelineFamilyShowcase />
        </section>

        {/* FEATURE 2: AI AGENT & LLM NATIVE */}
        <section id="ai-agent" className="pt-24 space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent font-mono">
              <SparklesIcon className="h-4 w-4" />
              <span>Pair-Programming Native</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              Built for Your AI Coding Agent.
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Point Cursor, Claude Code, Windsurf, or custom CLI agents at <code className="text-accent">/llms.txt</code>. With a personal access token, your agent mirrors PRs, branches, and card states in milliseconds.
            </p>
          </div>

          <AiAgentShowcase />
        </section>

        {/* FEATURE 3: JIRA & GITHUB REAL-TIME SYNC */}
        <section id="integrations" className="pt-24 space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent font-mono">
              <GitPullRequestIcon className="h-4 w-4" />
              <span>Bi-Directional Awareness</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              Live GitHub PR & Jira Status Sync.
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Connect your Jira board and GitHub repositories to automatically reflect review approvals, passing CI checks, and board transitions into your status bar.
            </p>
          </div>

          <IntegrationsShowcase />
        </section>

        {/* FEATURE 4: WEEKLY TIMESHEET & AUTOTEMPO */}
        <section id="timesheet" className="pt-24 space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent font-mono">
              <CalendarIcon className="h-4 w-4" />
              <span>Timesheet Peace of Mind</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              Weekly Tempo Attestation & AutoTempo.
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Never reconstruct your week on Friday afternoon. One-click daily attestation with an intelligent AutoTempo engine that maps work to official investment accounts.
            </p>
          </div>

          <TimesheetShowcase />
        </section>

        {/* FEATURE 5: VELOCITY & FLOW ANALYTICS */}
        <section id="analytics" className="pt-24 space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent font-mono">
              <BarChart3Icon className="h-4 w-4" />
              <span>High-Signal Metrics</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              Velocity, Cycle Times & Loose Ends Radar.
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Track throughput and phase bottlenecks from triage to production canary, with a radar that catches unverified subtasks and neglected PRs before releases.
            </p>
          </div>

          <AnalyticsShowcase />
        </section>

        {/* FEATURE 6: CRAFTED THEMES & AESTHETICS */}
        <section id="themes" className="pt-24 space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent font-mono">
              <PaletteIcon className="h-4 w-4" />
              <span>Paper & Lamplight</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              Editorial Craft & Handcrafted Themes.
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Designed with the tactile elegance of fine stationery. 4 handcrafted color palettes with complete Light and Dark mode parity, plus typography customization.
            </p>
          </div>

          <ThemeShowcase />
        </section>

        {/* SECTION 7: COMPARISON MATRIX */}
        <section className="pt-24 space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              How Waypoint Compares
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Waypoint is not another project management board — it is your personal developer cockpit.
            </p>
          </div>

          <ComparisonTable />
        </section>

        {/* SECTION 8: DEVELOPER FAQ */}
        <section id="faq" className="pt-24 space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Everything you need to know about architecture, security, and developer workflows.
            </p>
          </div>

          <FaqSection />
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="mt-24 rounded-2xl border border-edge bg-surface-2 p-8 sm:p-12 text-center shadow-card space-y-5">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink max-w-xl mx-auto">
            Ready to give your work external memory?
          </h2>
          <p className="text-sm text-ink-muted max-w-lg mx-auto leading-relaxed">
            Create an account in seconds. Point your AI pair at <code className="text-accent">/llms.txt</code> and never lose track of a card, PR, or timesheet again.
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
              className="rounded-xl border border-edge-strong bg-surface px-6 py-3 text-sm font-medium text-ink hover:bg-surface-3/50 transition"
            >
              Explore API reference
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-edge bg-surface">
        <div className="mx-auto flex max-w-[1120px] flex-col sm:flex-row items-center justify-between gap-4 px-6 sm:px-8 py-6 text-xs text-ink-faint">
          <div className="flex items-center gap-2.5">
            <Logo className="h-5 w-5 opacity-70" />
            <span className="font-serif font-semibold text-ink">Waypoint</span>
            <span>— external memory for developers</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-ink-muted">
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
