"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function AppNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-6 px-4">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
          <span className="text-live">◆</span> Waypoint
        </Link>
        <nav className="flex gap-1 text-sm">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded px-2.5 py-1 ${
                pathname === t.href
                  ? "bg-surface-2 text-ink"
                  : "text-ink-muted hover:bg-surface hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-xs text-ink-muted">
          <span className="hidden font-mono sm:inline">{email}</span>
          <button
            onClick={async () => {
              await authClient.signOut();
              router.push("/login");
              router.refresh();
            }}
            className="rounded border border-edge px-2 py-1 hover:bg-surface-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
