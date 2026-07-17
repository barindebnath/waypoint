import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingDemo } from "@/components/landing-demo";

export const metadata = {
  title: "Waypoint — external memory for shipping developers",
  description:
    "A personal status tracker your AI updates for you: one bar per card, from picked-up to closed-out.",
};

function Pill({ text, tone }: { text: string; tone?: "support" | "product" }) {
  const cls =
    tone === "support"
      ? "border-support/50 text-support"
      : tone === "product"
        ? "border-product/50 text-product"
        : "border-edge text-ink-muted";
  return (
    <span className={`rounded-full border bg-surface-2 px-2 py-0.5 font-mono text-xs ${cls}`}>{text}</span>
  );
}

export default async function LandingPage() {
  // Signed-in users land straight in the app.
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_500px_at_82%_-8%,rgba(56,189,248,0.08),transparent_60%),radial-gradient(700px_480px_at_8%_110%,rgba(251,191,36,0.05),transparent_60%)]">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-edge bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <span className="flex items-center gap-1.5 text-base font-semibold tracking-tight">
            <span className="text-live">◆</span> Waypoint
          </span>
          <div className="hidden items-center gap-6 text-sm text-ink-muted sm:flex">
            <a href="#pipelines" className="hover:text-ink">Pipelines</a>
            <a href="#automation" className="hover:text-ink">Automation</a>
            <Link href="/docs" className="hover:text-ink">Docs</Link>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="rounded border border-edge px-3 py-1.5 text-sm text-ink hover:border-live hover:text-live">
              Log in
            </Link>
            <Link href="/signup" className="rounded bg-live/90 px-3 py-1.5 text-sm font-medium text-bg hover:bg-live">
              Create account
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="mx-auto grid max-w-5xl items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-20">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-live">
            External memory for shipping developers
          </p>
          <h1 className="max-w-[16ch] text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            You ship more now. Let Waypoint remember where everything is.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-muted">
            AI writes the code, opens the PR, posts the update. You&apos;re steering{" "}
            <b className="font-medium text-ink">five cards at once</b>. Waypoint keeps each one
            legible — a single bar from picked-up to closed-out — and your agents move the bars for
            you.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded bg-live/90 px-4 py-2.5 text-sm font-medium text-bg hover:bg-live">
              Create your account
            </Link>
            <Link href="/docs" className="rounded border border-edge px-4 py-2.5 text-sm text-ink hover:border-live hover:text-live">
              Read the docs →
            </Link>
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-live shadow-[0_0_0_4px_rgba(56,189,248,0.15)]" />
            Free &amp; open source · no trackers · your data exports and deletes itself
          </p>
        </div>
        <LandingDemo />
      </header>

      {/* PROBLEM */}
      <section className="border-t border-edge">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-5 py-20 md:grid-cols-2">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-live">The AI-era problem</p>
            <h2 className="text-3xl font-semibold tracking-tight">More throughput, thinner memory.</h2>
            <p className="mt-4 max-w-md text-ink-muted">
              Agentic tooling multiplied how much one developer moves in a day. What didn&apos;t scale
              is your head. Context-switching between in-flight cards is where the dropped work, the
              forgotten close-out comment, and the &ldquo;wait, did that deploy?&rdquo; live.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <div className="min-w-36 flex-1 rounded-xl border border-edge bg-surface p-4">
                <div className="text-3xl font-semibold text-live">3–5×</div>
                <div className="mt-1 text-xs text-ink-muted">cards in flight per dev, once agents do the typing</div>
              </div>
              <div className="min-w-36 flex-1 rounded-xl border border-edge bg-surface p-4">
                <div className="text-3xl font-semibold text-support">1</div>
                <div className="mt-1 text-xs text-ink-muted">board that survives the context switch</div>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-edge bg-surface text-sm">
            {[
              { k: "before", text: "Where did ZT-4821 get to?", old: true },
              { k: "before", text: "Is the fix on staging or prod?", old: true },
              { k: "before", text: "Did I submit last week in Tempo?", old: true },
              { k: "now", text: "Every bar shows exactly where it stopped, stamped in UTC.", old: false },
              { k: "now", text: "Your agent ticks the sub-task the moment the PR is raised.", old: false },
              { k: "now", text: "Five checks and a ◆ — the week is attested.", old: false },
            ].map((r, i) => (
              <div key={i} className={`flex items-center gap-3 border-b border-edge px-5 py-3.5 last:border-b-0 ${r.old ? "text-ink-faint" : ""}`}>
                <span className={`w-14 shrink-0 font-mono text-[10px] uppercase ${r.old ? "text-danger/60" : "text-live"}`}>{r.k}</span>
                <span className={r.old ? "line-through decoration-ink-faint" : ""}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PIPELINES */}
      <section id="pipelines" className="border-t border-edge">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-live">One row, one bar</p>
          <h2 className="text-3xl font-semibold tracking-tight">A row has no title. It is its cards.</h2>
          <p className="mt-4 max-w-xl text-ink-muted">
            Every unit of work is identified by the card you picked up —{" "}
            <Pill text="ZT-4821" tone="support" /> for support, <Pill text="OFF-5678" tone="product" /> for
            product — with the dupe card and PRs riding along as pills. No free text anywhere, so
            confidential content structurally can&apos;t leak into your tracker.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                tag: "Support · Bug",
                tone: "text-support",
                title: "Find it, fix it, prove it, close both sides.",
                steps: ["Triage & Setup", "Development", "Staging", "QA & Review", "Production & Close-out"],
              },
              {
                tag: "Support · Task",
                tone: "text-done",
                title: "The DB-query fix, tracked honestly.",
                steps: ["Triage & Setup", "Resolution", "Close-out"],
              },
              {
                tag: "Feature",
                tone: "text-product",
                title: "Define it, ship it, prove it live.",
                steps: ["Definition", "Development", "Staging", "QA & Review", "Production & Close"],
              },
            ].map((p) => (
              <div key={p.tag} className="rounded-xl border border-edge bg-surface p-5">
                <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${p.tone}`}>{p.tag}</span>
                <h3 className="mt-1.5 text-lg font-medium">{p.title}</h3>
                <ol className="mt-4 space-y-2">
                  {p.steps.map((s, i) => (
                    <li key={s} className={`flex items-center gap-2.5 text-sm ${i === p.steps.length - 1 ? "text-ink" : "text-ink-muted"}`}>
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border font-mono text-[10px] ${i === p.steps.length - 1 ? "border-done bg-done text-bg" : "border-edge text-live"}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-start gap-4 rounded-xl border border-dashed border-edge bg-surface-2/60 p-5 text-sm text-ink-muted">
            <span className="font-mono text-live">▣</span>
            <p className="max-w-3xl">
              Every sub-task is mandatory: check the last one and the milestone completes and the bar
              advances itself. Work goes backwards exactly one way — <b className="text-ink">uncheck a milestone</b>{" "}
              and it clears, along with everything after it. A finished row with an unchecked sub-task
              stays visible as a <span className="text-warn">loose end</span> until you tie it off.
            </p>
          </div>
        </div>
      </section>

      {/* AUTOMATION */}
      <section id="automation" className="border-t border-edge">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-5 py-20 md:grid-cols-2">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-live">Your agents move the bars</p>
            <h2 className="text-3xl font-semibold tracking-tight">The API is the dashboard.</h2>
            <p className="mt-4 max-w-md text-ink-muted">
              Everything you can click, an agent can call — same engine, same rules, authenticated as
              you with a scoped token.
            </p>
            <div className="mt-6 space-y-4 text-sm">
              {[
                ["Instructions built in", <>Point any agent at <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-live">/llms.txt</code> — the live instruction file that teaches it when to create rows, what to tick, and what never to write.</>],
                ["Scoped tokens, shown once", "read or read+write, hashed at rest, revocable in one click."],
                ["Server-authoritative", "Agents report what happened; the engine decides completion and advancement. A bar can't be forged forward."],
                ["Idempotent writes", "A retried job or replayed webhook never double-applies."],
              ].map(([title, body], i) => (
                <div key={i} className="flex gap-3">
                  <span className="mt-0.5 font-mono text-live">→</span>
                  <div>
                    <b className="text-ink">{title}</b>
                    <p className="text-ink-muted">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-edge bg-[#080b12] font-mono text-[13px] leading-relaxed">
            <div className="flex items-center gap-1.5 border-b border-edge px-4 py-2.5 text-[10px] text-ink-faint">
              <i className="h-2.5 w-2.5 rounded-full bg-edge" />
              <i className="h-2.5 w-2.5 rounded-full bg-edge" />
              <i className="h-2.5 w-2.5 rounded-full bg-edge" />
              <span className="ml-2">the PR just went up — mirror it</span>
            </div>
            <pre className="overflow-x-auto p-5 text-ink-muted">
              <span className="text-ink-faint"># tick the sub-task…</span>{"\n"}
              curl -X POST $WAYPOINT/api/v1/rows/ZT-4821/subtasks \{"\n"}
              {"  "}-H <span className="text-[#8fb2ff]">&quot;Authorization: Bearer $WAYPOINT_TOKEN&quot;</span> \{"\n"}
              {"  "}-H <span className="text-[#8fb2ff]">&quot;Idempotency-Key: $RUN_ID&quot;</span> \{"\n"}
              {"  "}-d <span className="text-support">&apos;{"{"}&quot;milestone&quot;:&quot;development&quot;,{"\n"}
              {"       "}&quot;subtask&quot;:&quot;pr_raised&quot;,&quot;checked&quot;:true{"}"}&apos;</span>{"\n\n"}
              <span className="text-ink-faint"># …and pin the PR to the row</span>{"\n"}
              curl -X POST $WAYPOINT/api/v1/rows/ZT-4821/refs \{"\n"}
              {"  "}-d <span className="text-support">&apos;{"{"}&quot;action&quot;:&quot;add&quot;,&quot;ref&quot;:&quot;panipuri#87&quot;{"}"}&apos;</span>{"\n\n"}
              <span className="text-done">{"{"} &quot;row&quot;: {"{"} &quot;currentMilestone&quot;: &quot;staging&quot;,{"\n"}
              {"  "}&quot;isComplete&quot;: false, … {"}"} {"}"}</span>
            </pre>
          </div>
        </div>
      </section>

      {/* TIMESHEET + INSPECTION */}
      <section className="border-t border-edge">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-live">Two more things it remembers</p>
          <h2 className="mb-10 text-3xl font-semibold tracking-tight">Hours and hindsight, handled.</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-edge bg-surface p-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">Timesheet · pinned to the bottom</p>
              <h3 className="text-lg font-medium">Five checks, one ◆.</h3>
              <p className="mt-2 text-sm text-ink-muted">
                Each weekday tick attests &ldquo;Tempo is logged for that day.&rdquo; Fill all five and
                the submit marker unlocks. Weeks are stored per ISO week and filed under the month
                their Friday falls in — straddling weeks land in the right month automatically.
              </p>
              <div className="mt-5 flex items-center gap-2">
                {["M", "T", "W", "T", "F"].map((d, i) => (
                  <span key={i} className="grid h-8 w-8 place-items-center rounded border border-done/60 bg-done/25 font-mono text-xs text-done">
                    {d}
                  </span>
                ))}
                <span className="ml-1 text-xl text-done">◆</span>
                <span className="font-mono text-[10px] text-ink-faint">submitted</span>
              </div>
            </div>
            <div className="rounded-xl border border-edge bg-surface p-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">Inspection mode</p>
              <h3 className="text-lg font-medium">Scrub back to any window.</h3>
              <p className="mt-2 text-sm text-ink-muted">
                Pick a date range and the board goes read-only: rows nothing touched in the window
                drop away, and inside the survivors, only the milestones that actually moved stay
                lit. Time-travel without editing the past.
              </p>
              <div className="mt-6">
                <div className="relative h-1.5 rounded bg-surface-3">
                  <div className="absolute left-[34%] top-0 h-1.5 w-[26%] rounded bg-support shadow-[0_0_12px_rgba(251,191,36,0.3)]" />
                </div>
                <div className="mt-2 flex justify-between font-mono text-[10px] text-ink-faint">
                  <span>Jul 01</span><span>Jul 10</span><span>Jul 17</span><span>Jul 31</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section className="border-t border-edge">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-live">Privacy</p>
          <h2 className="text-3xl font-semibold tracking-tight">Nothing to leak, by design.</h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted">
            No titles, no descriptions, no free text — a row is card refs and checkboxes, so your
            work&apos;s contents can&apos;t end up here. Your account is an email, a password hash,
            and a timezone. Export everything as JSON or hard-delete it all, self-serve.{" "}
            <Link href="/privacy" className="text-live hover:underline">The whole policy fits on one page.</Link>
          </p>
          <div className="mt-10">
            <Link href="/signup" className="rounded bg-live/90 px-5 py-3 text-sm font-medium text-bg hover:bg-live">
              Start remembering →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-edge">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-xs text-ink-faint">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted">
            <span className="text-live">◆</span> Waypoint
          </span>
          <span className="flex items-center gap-4">
            <Link href="/docs" className="hover:text-ink">Docs</Link>
            <a href="/llms.txt" className="hover:text-ink">llms.txt</a>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <a href="https://github.com/barindebnath/waypoint" className="hover:text-ink" target="_blank" rel="noreferrer noopener">GitHub</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
