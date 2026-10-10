"use client";

/**
 * Sidebar state: expanded or collapsed to an icon rail. It is saved per device in
 * localStorage ("wp-sidebar") and shown as <html data-sidebar="collapsed">.
 * The script in layout.tsx sets the attribute before first paint, so a reload does not flash.
 * The attribute is the one source of truth. The CSS in globals.css reads it.
 */

const KEY = "wp-sidebar";
const listeners = new Set<() => void>();

export function getSidebarCollapsed(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-sidebar") === "collapsed";
}

export function setSidebarCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(KEY, collapsed ? "collapsed" : "open");
  } catch {
    // Private mode can refuse storage. The state still works for this page view.
  }
  if (collapsed) document.documentElement.setAttribute("data-sidebar", "collapsed");
  else document.documentElement.removeAttribute("data-sidebar");
  listeners.forEach((fn) => fn());
}

export function subscribeSidebar(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
