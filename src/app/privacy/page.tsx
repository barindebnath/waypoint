import Link from "next/link";

import { Logo } from "@/components/logo";

export const metadata = { title: "Privacy — Waypoint" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="mb-1 flex items-center gap-3 font-serif text-3xl font-medium tracking-tight">
        <Logo className="h-8 w-8 -mt-0.5" />
        <span>Waypoint — Privacy</span>
      </h1>
      <p className="mb-8 font-serif text-sm italic text-ink-muted">Deliberately boring, by design.</p>

      <div className="space-y-6 text-sm leading-relaxed text-ink">
        <section>
          <h2 className="mb-1 font-medium">What is stored</h2>
          <ul className="list-disc space-y-1 pl-5 text-ink-muted">
            <li>Your email address, a password hash, and your timezone. Nothing else about you — no name field exists.</li>
            <li>
              Your own tracker data: card reference strings (like <span className="font-mono">PES-11929</span>),
              checkbox states, and timestamps. There are no free-text fields, so the contents of your work
              can&apos;t end up here.
            </li>
            <li>Personal access tokens you create, stored hashed.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-medium">What is not done</h2>
          <ul className="list-disc space-y-1 pl-5 text-ink-muted">
            <li>No analytics trackers, no advertising, no third-party cookies — only a session cookie.</li>
            <li>No reading from or writing to Jira, GitHub, Teams, or any external tool.</li>
            <li>No selling, sharing, or profiling. Your rows are visible to your account only.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-medium">Where it lives</h2>
          <p className="text-ink-muted">
            The database is hosted on Neon (PostgreSQL) in the Singapore region; the app runs on Vercel.
            Server logs are the platforms&apos; default short-retention logs; IP addresses are not copied
            into the application&apos;s own tables.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-medium">Your rights, self-serve</h2>
          <p className="text-ink-muted">
            Settings → <em>Export JSON</em> downloads everything Waypoint knows about you.
            Settings → <em>Delete account</em> permanently and immediately erases your account and every
            row it owns — no email, no waiting period, no soft delete. These cover access, portability,
            and erasure under GDPR/UK GDPR, India&apos;s DPDP Act 2023, and similar laws, without you
            having to ask anyone.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-medium">Contact</h2>
          <p className="text-ink-muted">
            Waypoint is a personal, open-source project. Questions or requests: open an issue on the
            GitHub repository.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/" className="hover:underline">
          ← Back to Waypoint
        </Link>
      </p>
    </main>
  );
}
