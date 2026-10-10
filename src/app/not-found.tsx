import Link from "next/link";
import { LogoTile } from "@/components/logo";
import { btnPrimary } from "@/components/ui";

export const metadata = { title: "Page not found — Waypoint" };

/** The page for a URL that does not exist. It uses the same panel on a dark desk as the other pages. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-desk p-4">
      <div className="w-full max-w-md rounded-panel bg-bg p-8 text-center sm:p-10">
        <LogoTile className="mx-auto h-14 w-14" />
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">Error 404</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">This page does not exist.</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">The link may be old, or the page may have moved.</p>
        <div className="mt-7 flex justify-center">
          <Link href="/" className={btnPrimary}>
            Back to Waypoint
          </Link>
        </div>
      </div>
    </main>
  );
}
