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
      // Band starts just below the sticky header so scroll-mt-20 anchors land inside it.
      { rootMargin: "-64px 0px -70% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [groups]);

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 overflow-y-auto border-r border-edge py-8 pr-6 md:block md:w-56">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint first:mt-0">
            {g.title}
          </p>
          {g.items.map((i) => (
            <a
              key={i.id}
              href={`#${i.id}`}
              className={`block border-l-2 py-1.5 pl-3 text-sm transition-colors ${
                active === i.id
                  ? "border-live text-live"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {i.label}
            </a>
          ))}
        </div>
      ))}
    </aside>
  );
}
