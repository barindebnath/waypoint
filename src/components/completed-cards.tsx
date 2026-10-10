"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { BoardCard } from "./board-card";
import { ChevronRightIcon } from "./icons";

/**
 * Every completed row as a Board card. The section is closed by default.
 * A click on a card opens the same editable modal as on the Board.
 * It does not use the Analytics date or work-type filters.
 */
export function CompletedCards() {
  const { data } = useQuery({ queryKey: ["rows"], queryFn: api.rows });
  const [open, setOpen] = useState(false);
  const done = (data?.rows ?? []).filter((r) => r.isComplete);

  return (
    <section id="completed-cards" className="mt-6 scroll-mt-20 rounded-2xl border border-edge bg-surface p-5 shadow-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 text-left text-[13px] font-semibold text-ink hover:text-accent-fg"
      >
        <ChevronRightIcon className={`h-4 w-4 text-ink-muted transition-transform ${open ? "rotate-90" : ""}`} />
        Completed cards
        <span className="rounded-full bg-surface-3 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-ink-muted">
          {done.length}
        </span>
        <span className="ml-auto text-[11px] font-normal text-ink-faint">All time, all work types</span>
      </button>
      {open && (
        <div className="mt-4 grid items-start gap-3 rounded-xl bg-lane p-3 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
          {done.map((r) => (
            <BoardCard key={r.id} row={r} />
          ))}
          {done.length === 0 && <p className="text-xs text-ink-faint">No completed cards yet.</p>}
        </div>
      )}
    </section>
  );
}
