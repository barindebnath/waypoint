"use client";

import { useEffect, useState } from "react";

export function DocsSidebar({
  groups,
}: {
  groups: { title: string; items: { id: string; label: string }[] }[];
}) {
  const [active, setActive] = useState<string>(groups[0]?.items[0]?.id ?? "");

  useEffect(() => {
    const ids = groups.flatMap((g) => g.items.map((i) => i.id));
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      // The sticky header band is 80px high. The observer area starts 8px below it.
      // A heading that scrolls to its anchor (scroll-mt-24) lands inside this area.
      { rootMargin: "-88px 0px -70% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [groups]);

  return (
    // The top offset (top-20) is the height of the sticky header band on the docs page.
    <aside className="sticky top-20 hidden h-[calc(100dvh-5rem)] shrink-0 overflow-y-auto py-8 md:block md:w-56">
      {/* The side padding keeps the focus ring of a link inside the scroll area. */}
      <nav aria-label="Docs sections" className="px-1">
        {groups.map((g) => (
          <div key={g.title} className="mt-6 first:mt-0">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map((i) => {
                const isActive = active === i.id;
                return (
                  <li key={i.id}>
                    <a
                      href={`#${i.id}`}
                      aria-current={isActive ? "location" : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-colors ${
                        isActive ? "bg-surface-2 text-ink" : "text-ink-muted hover:bg-surface hover:text-ink"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${isActive ? "bg-accent" : "bg-transparent"}`}
                      />
                      {i.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
