"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { authClient } from "@/lib/auth-client";
import { getSidebarCollapsed, setSidebarCollapsed, subscribeSidebar } from "@/lib/sidebar";
import { BoardIcon, BookIcon, ChartIcon, CloseIcon, LogoutIcon, MenuIcon, SidebarIcon, SlidersIcon } from "./icons";
import { PIPELINE_STYLE } from "./chip";
import { LogoTile } from "./logo";
import { Spinner } from "./spinner";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/board", label: "Board", icon: BoardIcon },
  { href: "/analytics", label: "Analytics", icon: ChartIcon },
  { href: "/settings", label: "Settings", icon: SlidersIcon },
  { href: "/docs", label: "Docs", icon: BookIcon },
] as const;

/** "ada.lovelace@example.com" -> "ada.lovelace". */
function nameOf(email: string): string {
  return email.split("@")[0] || email;
}

/**
 * The shell of every signed-in page: a desk with two floating panels on it.
 * The sidebar is on the left. The page is in the main panel on the right and uses all the room left.
 * Below 1024px the sidebar becomes a top bar with a drawer.
 */
export function AppShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  // The drawer remembers the page it was opened on. When the page changes, it is closed.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const drawerOpen = openedAt === pathname;
  const setDrawerOpen = (open: boolean) => setOpenedAt(open ? pathname : null);
  const collapsed = useSyncExternalStore(subscribeSidebar, getSidebarCollapsed, () => false);

  // Close the drawer on Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedAt(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="flex h-dvh flex-col gap-3 overflow-hidden bg-desk p-2.5 lg:flex-row lg:p-3">
      {/* Desktop sidebar */}
      <aside className="wp-sidebar hidden shrink-0 flex-col rounded-panel bg-bg lg:flex" aria-label="Main navigation">
        <SidebarBody
          email={email}
          collapsed={collapsed}
          onToggleCollapse={() => setSidebarCollapsed(!collapsed)}
        />
      </aside>

      {/* Mobile top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between rounded-2xl bg-bg pl-3 pr-2 lg:hidden">
        <Link href="/board" className="flex items-center gap-2.5 text-ink">
          <LogoTile className="h-9 w-9" />
          <span className="font-serif text-lg font-semibold tracking-tight">Waypoint</span>
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-ink hover:bg-surface-3"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
          />
          <div className="relative flex h-full w-[300px] max-w-[86vw] animate-slide-in flex-col rounded-r-panel bg-bg shadow-pop">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-ink-muted hover:text-ink"
            >
              <CloseIcon className="h-[18px] w-[18px]" />
            </button>
            <SidebarBody email={email} collapsed={false} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* The main panel. The page decides how to scroll inside it. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-panel bg-bg">{children}</div>
    </div>
  );
}

function SidebarBody({
  email,
  collapsed,
  onNavigate,
  onToggleCollapse,
}: {
  email: string;
  collapsed: boolean;
  onNavigate?: () => void;
  /** Only the desktop sidebar can collapse. */
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // The same query as the Board, so the cache is shared. The sidebar needs it for the counts.
  const { data } = useQuery({ queryKey: ["rows"], queryFn: api.rows, staleTime: 30_000 });
  const active = (data?.rows ?? []).filter((r) => !r.isComplete);

  async function signOut() {
    setSigningOut(true);
    onNavigate?.();
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  const name = nameOf(email);
  const domain = email.includes("@") ? email.slice(email.indexOf("@") + 1) : "";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      {/* Brand */}
      <div className="wp-head flex items-center gap-3">
        <Link href="/board" className="wp-center flex min-w-0 flex-1 items-center gap-3 text-ink" onClick={onNavigate}>
          <LogoTile className="h-11 w-11" />
          <span className="wp-label min-w-0">
            <span className="block truncate font-serif text-[18px] font-semibold leading-tight tracking-tight">Waypoint</span>
            <span className="block truncate text-xs text-ink-faint">Work status tracker</span>
          </span>
        </Link>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <SidebarIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="mt-7" aria-label="Pages">
        <p className="wp-label px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Workspace</p>
        <ul className="space-y-1">
          {NAV.map((item) => {
            const isActive = pathname === item.href;
            const badge = item.href === "/board" && data ? active.length : null;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`wp-center relative flex h-11 items-center gap-3 rounded-2xl px-3.5 text-[14px] font-medium transition-colors ${
                    isActive ? "bg-surface-2 text-ink" : "text-ink-muted hover:bg-surface hover:text-ink"
                  }`}
                >
                  <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-accent-fg" : ""}`} />
                  <span className="wp-label flex-1 truncate">{item.label}</span>
                  {badge !== null && badge > 0 && (
                    <span className="wp-badge grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-ink">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Pipelines: a legend for the dots on the Board cards, with the count in flight */}
      <div className="wp-label mt-7">
        <p className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Pipelines</p>
        <ul className="space-y-0.5">
          {Object.entries(PIPELINE_STYLE).map(([key, p]) => (
            <li key={key} className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-[13px] text-ink-muted">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${p.dot}`} aria-hidden />
              <span className="flex-1 truncate">{p.label}</span>
              <span className="font-mono text-xs tabular-nums text-ink-faint">
                {data ? active.filter((r) => r.pipelineKey === key).length : "–"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Account */}
      <div className="mt-auto pt-4">
        <div className="wp-label rounded-3xl bg-surface p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-chip-lime text-sm font-bold text-chip-ink">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold leading-tight" title={email}>
                {name}
              </p>
              <p className="truncate text-xs text-ink-faint" title={email}>
                {domain}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-edge/70 pt-3">
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="flex h-9 items-center gap-2 rounded-full px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
            >
              {signingOut ? <Spinner className="h-3.5 w-3.5 text-current" /> : <LogoutIcon className="h-4 w-4" />}
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* The same account controls for the icon rail */}
        <div className="wp-rail hidden flex-col items-center gap-2">
          <span
            className="grid h-10 w-10 place-items-center rounded-full bg-chip-lime text-sm font-bold text-chip-ink"
            title={email}
          >
            {initial}
          </span>
          <ThemeToggle />
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            aria-label="Sign out"
            title="Sign out"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-ink-muted transition-colors hover:bg-danger/15 hover:text-danger disabled:opacity-50"
          >
            {signingOut ? <Spinner className="h-3.5 w-3.5 text-current" /> : <LogoutIcon className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>
    </div>
  );
}
