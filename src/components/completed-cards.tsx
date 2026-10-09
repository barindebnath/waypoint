"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { BoardCard } from "./board-card";

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
    <section id="completed-cards" className="mt-6 scroll-mt-20 rounded-xl border border-edge bg-surface p-5 shadow-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted hover:text-ink cursor-pointer"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>›</span>
        Completed cards ({done.length})
        <span className="ml-auto font-sans text-[11px] font-normal normal-case tracking-normal text-ink-faint">
          All time, all work types
        </span>
      </button>
      {open && (
        <div className="mt-4 grid items-start gap-2 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
          {done.map((r) => (
            <BoardCard key={r.id} row={r} />
          ))}
          {done.length === 0 && (
            <p className="font-serif text-xs italic text-ink-faint">No completed cards yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
