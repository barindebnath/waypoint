import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  CompassIcon,
  KeyIcon,
  LinkIcon,
  ShieldCheckIcon,
  UserIcon,
  type IconProps,
} from "@/components/icons";
import { LogoTile } from "@/components/logo";
import { btnSecondary } from "@/components/ui";

export const metadata = { title: "Privacy — Waypoint" };

/** One topic of the policy: a round card with an icon tile and a title. */
function Topic({ icon: Icon, title, children }: { icon: ComponentType<IconProps>; title: string; children: ReactNode }) {
  return (
    <section className="rounded-card bg-surface p-5 ring-1 ring-edge/70 sm:p-6">
      <h2 className="mb-3 flex items-center gap-3 text-[15px] font-semibold tracking-tight">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent-fg">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A short piece of mono text, for example a card ref. */
function Mono({ children }: { children: ReactNode }) {
  return <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[12.5px] text-ink">{children}</span>;
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex-1 bg-desk px-2.5 py-3 sm:px-3 sm:py-10">
      <div className="mx-auto w-full max-w-3xl rounded-panel bg-bg p-5 sm:p-10">
        <h1 className="flex items-center gap-3.5 font-serif text-[26px] font-semibold leading-tight tracking-tight sm:text-3xl">
          <LogoTile className="h-11 w-11" />
          <span>Waypoint — Privacy</span>
        </h1>
        <p className="mb-8 mt-3 text-sm text-ink-muted">Deliberately boring, by design.</p>

        <div className="space-y-4 text-sm leading-relaxed text-ink">
          <Topic icon={UserIcon} title="What is stored">
            <ul className="list-disc space-y-1.5 pl-5 text-ink-muted marker:text-ink-faint">
              <li>Your email address, a password hash, and your timezone. Nothing else about you — no name field exists.</li>
              <li>
                Your own tracker data: card reference strings (like <Mono>PES-11929</Mono>),
                checkbox states, and timestamps. There are no free-text fields, so the contents of your work
                can&apos;t end up here.
              </li>
              <li>Personal access tokens you create, stored hashed.</li>
              <li>
                Optional integration credentials you configure in Settings (Jira API Token &amp; Email, GitHub PAT,
                Tempo API Token, and Microsoft Outlook OAuth refresh token). These are stored per-user and used
                server-side only to look up card/PR statuses and log your Tempo timesheets upon your request.
              </li>
            </ul>
          </Topic>

          <Topic icon={ShieldCheckIcon} title="What is not done">
            <ul className="list-disc space-y-1.5 pl-5 text-ink-muted marker:text-ink-faint">
              <li>No analytics trackers, no advertising, no third-party cookies — only a session cookie.</li>
              <li>
                No storing or copying of ticket descriptions, customer data, code diffs, or repository contents — reference keys and status badges only.
              </li>
              <li>
                No automated or unrequested mutations — external tools like Tempo are updated only when you explicitly invoke AutoTempo or trigger a timesheet action.
              </li>
              <li>No selling, sharing, or profiling. Your rows and credentials are visible to your account only.</li>
            </ul>
          </Topic>

          <Topic icon={CompassIcon} title="Where it lives">
            <p className="text-ink-muted">
              The database is hosted on Neon (PostgreSQL) in the Singapore region; the app runs on Vercel.
              Server logs are the platforms&apos; default short-retention logs; IP addresses are not copied
              into the application&apos;s own tables.
            </p>
          </Topic>

          <Topic icon={KeyIcon} title="Your rights, self-serve">
            <p className="text-ink-muted">
              Settings → <em className="font-medium not-italic text-ink">Export JSON</em> downloads everything Waypoint knows about you.
              Settings → <em className="font-medium not-italic text-ink">Delete account</em> permanently and immediately erases your account and every
              row it owns — no email, no waiting period, no soft delete. These cover access, portability,
              and erasure under GDPR/UK GDPR, India&apos;s DPDP Act 2023, and similar laws, without you
              having to ask anyone.
            </p>
          </Topic>

          <Topic icon={LinkIcon} title="Contact">
            <p className="text-ink-muted">
              Waypoint is a personal, open-source project. Questions or requests: open an issue on the
              GitHub repository.
            </p>
          </Topic>
        </div>

        <p className="mt-8">
          <Link href="/" className={btnSecondary}>
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Waypoint
          </Link>
        </p>
      </div>
    </main>
  );
}
