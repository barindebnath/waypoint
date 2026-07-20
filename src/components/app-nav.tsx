"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
  { href: "/docs", label: "Docs" },
];

export function AppNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-double border-edge-strong bg-surface shadow-card">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-7 pb-[11px] pt-[13px]">
        <Link href="/dashboard" className="flex items-center gap-2.5 !text-ink hover:!text-ink shrink-0">
          <Logo className="h-6 w-6 -mt-0.5" />
          <span className="font-serif text-[21px] font-semibold tracking-tight">Waypoint</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-[22px]">
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

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <span suppressHydrationWarning className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">
            {today.replace(",", " ·")}
          </span>
          <ThemeToggle />
          <span className="font-mono text-[11px] text-ink-muted">{email}</span>
          <button
            onClick={async () => {
              await authClient.signOut();
              router.push("/login");
              router.refresh();
            }}
            className="rounded-md border border-edge px-2.5 py-1 text-[11px] text-ink-muted hover:border-edge-strong cursor-pointer"
          >
            Sign out
          </button>
        </div>

        {/* Mobile Header Controls */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-edge text-ink hover:border-edge-strong cursor-pointer focus:outline-none"
          >
            {isOpen ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {isOpen && (
        <div className="fixed inset-0 top-[54px] z-30 md:hidden flex flex-col bg-surface/98 backdrop-blur-md transition-all duration-200 ease-in-out border-t border-edge">
          <div className="flex flex-col gap-6 p-7 flex-1 overflow-y-auto">
            <nav className="flex flex-col gap-4">
              {tabs.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={() => setIsOpen(false)}
                  className={`border-l-4 pl-4 py-2 text-[14px] uppercase tracking-[0.14em] font-medium hover:!text-ink ${
                    pathname === t.href
                      ? "border-accent !text-ink bg-accent-soft"
                      : "border-transparent !text-ink-muted"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-edge pt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                  Today
                </span>
                <span suppressHydrationWarning className="text-xs text-ink font-serif font-semibold">
                  {today}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                  Account
                </span>
                <span className="font-mono text-xs text-ink-muted break-all">{email}</span>
              </div>
              <button
                onClick={async () => {
                  setIsOpen(false);
                  await authClient.signOut();
                  router.push("/login");
                  router.refresh();
                }}
                className="mt-2 w-full rounded-md border border-edge py-2 text-xs text-ink-muted hover:border-edge-strong cursor-pointer font-medium text-center"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

