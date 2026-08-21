"use client";

import { useState } from "react";
import { ChevronDownIcon } from "./icons";

type FAQItem = {
  q: string;
  a: string;
};

const FAQS: FAQItem[] = [
  {
    q: "Why does Waypoint only store card references instead of card descriptions?",
    a: "Waypoint is intentionally designed with a zero-leakage security model. Storing card descriptions creates duplicate, out-of-sync copies of truth and risks leaking sensitive customer data or credentials. By holding only reference strings (e.g. ZT-4821, OFF-5678, owner/repo#42), you can safely mirror work from client or employer projects without risking data governance violations.",
  },
  {
    q: "How do AI agents like Claude Code, Cursor, or Windsurf update Waypoint?",
    a: "Waypoint serves live, machine-readable instructions at `/llms.txt`. You generate a scoped API token in Settings and pass it to your AI tool. As you code, raise PRs, and deploy, your AI agent calls the deterministic `/api/v1/rows/{ref}/subtasks` endpoint with an Idempotency-Key to mirror your real-world progress in milliseconds.",
  },
  {
    q: "Does Waypoint alter or push tickets in Jira or GitHub?",
    a: "No. Waypoint follows a strict 'Memory over Management' philosophy. It reads status from Jira and GitHub to automatically advance your personal milestone tracker, but it never modifies Jira tickets, merges PRs, or touches production repositories on its own.",
  },
  {
    q: "How does the AutoTempo rule engine work?",
    a: "In Settings, you can configure your default Tempo investment account rules (e.g. mapping support bug rows to BAU and feature rows to Capitalized Projects) along with custom skip-days and bank holidays. When you trigger AutoTempo, it automatically fills the corresponding Tempo day logs for verified completed work.",
  },
  {
    q: "Can I export or delete my data anytime?",
    a: "Yes. Waypoint respects complete data sovereignty. You can download a complete JSON export of all your rows, timestamps, and timesheet logs with one click from Settings, or permanently delete your account at any time.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="w-full space-y-3">
      {FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={faq.q}
            className="rounded-xl border border-edge bg-surface transition overflow-hidden"
          >
            <button
              onClick={() => toggle(idx)}
              className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition hover:bg-surface-2 cursor-pointer"
            >
              <span className="font-serif text-sm sm:text-base font-semibold text-ink pr-4">
                {faq.q}
              </span>
              <ChevronDownIcon
                className={`h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-accent" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="border-t border-edge bg-surface-2/40 p-4 sm:p-5 text-xs sm:text-sm text-ink-muted leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
