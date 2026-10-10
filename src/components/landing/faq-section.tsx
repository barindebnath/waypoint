"use client";

import { useState, type ReactNode } from "react";
import { ChevronDownIcon } from "./icons";

type FAQCategory = "all" | "security" | "ai" | "sync";

type FAQItem = {
  category: "security" | "ai" | "sync";
  q: string;
  a: string;
};

const FAQS: FAQItem[] = [
  {
    category: "security",
    q: "Why does Waypoint only store card references instead of card descriptions?",
    a: "Waypoint is intentionally designed with a zero-leakage security model. Storing card descriptions creates duplicate, out-of-sync copies of truth and risks leaking sensitive customer data or credentials. By holding only reference strings (e.g. ZT-4821, OFF-5678, owner/repo#42), you can safely mirror work from client or employer projects without risking data governance violations.",
  },
  {
    category: "ai",
    q: "How do AI agents like Claude Code, Cursor, or Windsurf update Waypoint?",
    a: "Waypoint serves live, machine-readable instructions at `/llms.txt`. You generate a scoped API token in Settings and pass it to your AI tool. As you code, raise PRs, and deploy, your AI agent calls the deterministic `/api/v1/rows/{ref}/subtasks` endpoint with an Idempotency-Key to mirror your real-world progress in milliseconds.",
  },
  {
    category: "sync",
    q: "Does Waypoint alter or push tickets in Jira or GitHub?",
    a: "No. Waypoint follows a strict 'Memory over Management' philosophy. It reads status from Jira and GitHub to automatically advance your personal milestone tracker, but it never modifies Jira tickets, merges PRs, or touches production repositories on its own.",
  },
  {
    category: "sync",
    q: "How does the AutoTempo rule engine work?",
    a: "In Settings, you can configure your default Tempo investment account rules (e.g. mapping support bug cards to BAU and feature cards to Capitalized Projects) along with custom skip-days and bank holidays. When you trigger AutoTempo, it automatically fills the corresponding Tempo day logs for verified completed work.",
  },
  {
    category: "security",
    q: "Can I export or delete my data anytime?",
    a: "Yes. Waypoint respects complete data sovereignty. You can download a complete JSON export of all your cards, timestamps, and timesheet logs with one click from Settings, or permanently delete your account at any time.",
  },
];

/** The text between two backticks shows as code. This makes React elements, so no HTML string is needed. */
function renderAnswer(text: string): ReactNode[] {
  return text.split("`").map((part, i) =>
    i % 2 === 1 ? (
      <code key={i} className="rounded-md bg-surface-3 px-1.5 py-0.5 font-mono text-[12.5px] text-ink">
        {part}
      </code>
    ) : (
      part
    ),
  );
}

export function FaqSection() {
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs =
    selectedCategory === "all"
      ? FAQS
      : FAQS.filter((f) => f.category === selectedCategory);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="w-full space-y-4">
      {/* Category Filter */}
      <div role="group" aria-label="Filter the questions" className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1 rounded-3xl bg-surface p-1">
        {[
          { key: "all", label: "All Questions" },
          { key: "security", label: "Security & Privacy" },
          { key: "ai", label: "AI Integration" },
          { key: "sync", label: "Sync & Timesheets" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-pressed={selectedCategory === tab.key}
            onClick={() => {
              setSelectedCategory(tab.key as FAQCategory);
              setOpenIndex(0);
            }}
            className={`h-9 cursor-pointer rounded-full px-3.5 text-[13px] font-medium transition-colors ${
              selectedCategory === tab.key
                ? "bg-accent font-semibold text-accent-ink"
                : "text-ink-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Accordion */}
      <div className="space-y-2.5 pt-2">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.q}
              className="overflow-hidden rounded-3xl bg-surface"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggle(idx)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-surface-2 sm:px-6 sm:py-5"
              >
                <span className="font-serif text-[15px] font-semibold leading-snug tracking-tight text-ink sm:text-base">
                  {faq.q}
                </span>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
                    isOpen ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink-muted"
                  }`}
                >
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-5 text-sm leading-relaxed text-ink-muted sm:px-6 sm:pb-6">
                  {renderAnswer(faq.a)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
