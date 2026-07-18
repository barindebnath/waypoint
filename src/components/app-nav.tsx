"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "./theme-toggle";

import { Logo } from "./logo";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Analytics" },
  { href: "/docs", label: "API docs" },
  { href: "/settings", label: "Settings" },
];

export function AppNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-double border-edge-strong bg-surface shadow-card">
      <div className="mx-auto flex max-w-[1100px] items-baseline gap-6 px-7 pb-[11px] pt-[13px]">
        <Link href="/dashboard" className="flex items-center gap-2.5 !text-ink hover:!text-ink">
          <Logo className="h-6 w-6 -mt-0.5" />
          <span className="font-serif text-[21px] font-semibold tracking-tight">Waypoint</span>
        </Link>
        <nav className="flex gap-[22px]">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`border-b-2 pb-1.5 pt-0.5 text-[11.5px] uppercase tracking-[0.14em] hover:!text-ink ${
                pathname === t.href
                  ? "border-accent !text-ink"
                  : "border-transparent !text-ink-muted"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-baseline gap-4">
          <span suppressHydrationWarning className="hidden text-[11px] uppercase tracking-[0.1em] text-ink-faint md:inline">
            {today.replace(",", " ·")}
          </span>
          <ThemeToggle />
          <span className="hidden font-mono text-[11px] text-ink-muted sm:inline">{email}</span>
          <button
            onClick={async () => {
              await authClient.signOut();
              router.push("/login");
              router.refresh();
            }}
            className="rounded-md border border-edge px-2.5 py-1 text-[11px] text-ink-muted hover:border-edge-strong"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
