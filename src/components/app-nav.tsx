"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";
import { Spinner } from "./spinner";

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
  const [signingOut, setSigningOut] = useState(false);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 sm:top-3 z-40 mx-auto w-full sm:w-[calc(100%-3.5rem)] max-w-[1044px] transition-all duration-300">
      {/* Top Bar Glass Capsule */}
      <div className="flex items-center justify-between lg:justify-start gap-4 lg:gap-8 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-none sm:rounded-2xl border-x-0 border-t-0 border-b sm:border border-edge/60 bg-surface/85 backdrop-blur-md shadow-card">
        <Link href="/dashboard" className="flex items-center gap-2 sm:gap-2.5 !text-ink hover:!text-ink shrink-0 transition-transform duration-200 hover:scale-[1.02]">
          <Logo className="h-5 w-5 sm:h-6 sm:w-6 -mt-0.5" />
          <span className="font-serif text-lg sm:text-[21px] font-semibold tracking-tight">Waypoint</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-1.5 lg:ml-4 shrink-0">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.12em] font-medium transition-all duration-200 ${
                  active
                    ? "bg-accent !text-accent-ink shadow-sm scale-[1.04]"
                    : "!text-ink-muted hover:bg-surface-2/65 hover:!text-ink hover:scale-[1.02]"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3.5 lg:ml-auto min-w-0">
          <span suppressHydrationWarning className="hidden xl:inline text-[10px] uppercase tracking-[0.1em] text-ink-faint shrink-0">
            {today.replace(",", " ·")}
          </span>
          <div className="hidden xl:block h-4 w-[1px] bg-edge/70 shrink-0" />
          <div className="shrink-0">
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-edge bg-surface-2/45 pl-3.5 pr-2 py-1 shadow-sm min-w-0 max-w-[180px] xl:max-w-[240px]">
            <span className="font-mono text-[10.5px] text-ink-muted leading-none truncate" title={email}>{email}</span>
            <button
              onClick={async () => {
                setSigningOut(true);
                await authClient.signOut();
                router.push("/");
                router.refresh();
              }}
              disabled={signingOut}
              title="Sign out"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-3 hover:bg-danger hover:text-white transition-colors cursor-pointer focus:outline-none disabled:opacity-50"
              aria-label="Sign out"
            >
              {signingOut ? (
                <Spinner className="h-3 w-3 text-current" />
              ) : (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Header Controls */}
        <div className="flex lg:hidden items-center gap-2.5">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-edge bg-surface-2/40 text-ink hover:border-edge-strong transition-all duration-200 cursor-pointer focus:outline-none"
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
        <div className="absolute top-full left-0 right-0 mt-2 z-30 lg:hidden flex flex-col bg-surface/65 backdrop-blur-lg rounded-2xl border border-edge/60 shadow-card transition-all duration-200 ease-in-out max-h-[calc(100vh-100px)] overflow-hidden">
          <div className="flex flex-col gap-5 p-6 overflow-y-auto">
            <nav className="flex flex-col gap-2.5">
              {tabs.map((t) => {
                const active = pathname === t.href;
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    onClick={() => setIsOpen(false)}
                    className={`rounded-xl px-4 py-2.5 text-[13px] uppercase tracking-[0.12em] font-medium transition-all ${
                      active
                        ? "bg-accent !text-accent-ink shadow-sm"
                        : "!text-ink-muted hover:bg-surface-2/60 hover:!text-ink"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-edge/80 pt-5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">Today</span>
                <span suppressHydrationWarning className="font-serif font-semibold text-ink">{today}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">Account</span>
                <span className="font-mono text-ink-muted break-all max-w-[70%] text-right">{email}</span>
              </div>
              <button
                onClick={async () => {
                  setSigningOut(true);
                  setIsOpen(false);
                  await authClient.signOut();
                  router.push("/");
                  router.refresh();
                }}
                disabled={signingOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-surface-2/70 border border-edge py-2.5 text-xs text-ink-muted hover:bg-danger hover:text-white hover:border-transparent transition-all cursor-pointer font-medium text-center disabled:opacity-50"
              >
                {signingOut && <Spinner className="h-3.5 w-3.5 text-current" />}
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
