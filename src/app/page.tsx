import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Waypoint — external memory for a developer who ships",
  description:
    "A personal status tracker your AI updates for you: one row per card, moving through a fixed milestone pipeline.",
};

export default async function LandingPage() {
  // Signed-in users land straight in the app.
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      {/* Header */}
      <header className="border-b-[3px] border-double border-edge-strong">
        <div className="mx-auto flex max-w-[1000px] items-center px-7 py-[18px]">
          <span className="flex items-center gap-2.5">
            <Logo className="h-6 w-6 -mt-0.5" />
            <span className="font-serif text-[21px] font-semibold">Waypoint</span>
          </span>
          <nav className="ml-6 flex gap-[22px]">
            <Link href="/docs" className="text-[13px] text-ink-muted hover:text-ink">
              Docs
            </Link>
            <a href="/llms.txt" className="text-[13px] text-ink-muted hover:text-ink">
              llms.txt
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            <Link href="/login" className="!text-ink-muted text-[13px] hover:!text-ink">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-[7px] bg-accent px-4 py-2 text-[13px] font-semibold !text-accent-ink hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto w-full max-w-[1000px] px-7 pb-20 pt-[72px] text-center">
        <p className="mb-[18px] text-[11px] uppercase tracking-[0.22em] text-accent">
          Personal status tracker
        </p>
        <h1 className="mx-auto max-w-[720px] text-balance font-serif text-5xl font-medium leading-[1.08] tracking-tight md:text-[58px]">
          External memory for a developer who ships.
        </h1>
        <p className="mx-auto mt-[22px] max-w-[540px] text-pretty text-base leading-relaxed text-ink-muted">
          One row per unit of work, moving left to right through a fixed milestone pipeline. Your AI
          updates it through the same API you click through. References only — never card contents.
        </p>
        <div className="mt-[30px] flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold !text-accent-ink hover:opacity-90"
          >
            Start tracking
          </Link>
          <Link
            href="/docs"
            className="rounded-lg border border-edge-strong px-6 py-3 text-sm !text-ink-muted hover:!text-ink"
          >
            Read the docs
          </Link>
        </div>

        {/* Sample row */}
        <div className="mx-auto mt-14 max-w-[760px] rounded-[14px] border border-edge bg-surface px-[22px] py-[18px] text-left shadow-card">
          <div className="flex items-center gap-3.5">
            <span className="whitespace-nowrap rounded-full border border-support bg-surface-2 px-2.5 py-[3px] font-mono text-[11.5px] font-medium text-support">
              ZT-4821
            </span>
            <span className="hidden whitespace-nowrap rounded-full border border-edge bg-surface-2 px-2.5 py-[3px] font-mono text-[11px] text-ink-muted sm:inline">
              PES-1032
            </span>
            <span className="flex flex-1 items-center">
              <span className="text-[13px] text-done">●</span>
              <span className="mx-[3px] h-[1.5px] flex-1 bg-done" />
              <span className="text-[13px] text-done">●</span>
              <span className="mx-[3px] h-[1.5px] flex-1 bg-done" />
              <span className="animate-live text-[13px] text-accent">●</span>
              <span className="mx-[3px] h-[1.5px] flex-1 bg-edge-strong" />
              <span className="text-[13px] text-ink-faint">○</span>
              <span className="mx-[3px] h-[1.5px] flex-1 bg-edge-strong" />
              <span className="text-[13px] text-ink-faint">○</span>
            </span>
            <span className="font-serif text-sm italic text-accent">Staging</span>
          </div>
          <p className="mt-3.5 border-t border-edge pt-3 font-serif text-[13.5px] italic text-ink-faint">
            Milestones complete themselves when every sub-task is checked — by you, or by your AI over
            the API.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-edge">
        <div className="mx-auto flex max-w-[1000px] flex-wrap gap-4 px-7 py-4 text-xs text-ink-faint">
          <span className="flex items-center gap-2">
            <Logo className="h-5 w-5 opacity-70" />
            <span>Waypoint</span>
          </span>
          <span className="ml-auto flex flex-wrap items-baseline gap-4">
            <span>API-first</span>
            <a href="/llms.txt" className="!text-ink-faint hover:!text-ink">
              /llms.txt
            </a>
            <Link href="/docs" className="!text-ink-faint hover:!text-ink">
              Docs
            </Link>
            <Link href="/privacy" className="!text-ink-faint hover:!text-ink">
              Privacy: references only, no trackers
            </Link>
            <a
              href="https://github.com/barindebnath/waypoint"
              target="_blank"
              rel="noreferrer noopener"
              className="!text-ink-faint hover:!text-ink"
            >
              GitHub
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
