"use client";

import { useState } from "react";
import { TerminalIcon, CopyIcon, CheckIcon, SparklesIcon } from "./icons";

type CodeTab = "prompt" | "api" | "llmstxt";

export function AiAgentShowcase() {
  const [activeTab, setActiveTab] = useState<CodeTab>("prompt");
  const [copied, setCopied] = useState(false);

  const copySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const PROMPT_SNIPPET = `// In Claude Code, Cursor, Windsurf, or Antigravity:
Developer: "I just raised PR #142 for ZT-4821 and verified the fix in staging."

AI Agent:
  → Reads live rules from /llms.txt
  → Mirrors PR link as secondary ref: POST /rows/ZT-4821/refs {"ref": "web-client#142"}
  → Ticks PR raised: POST /rows/ZT-4821/subtasks {"milestone": "development", "subtask": "pr_raised", "checked": true}
  → Ticks Staging deploy: POST /rows/ZT-4821/subtasks {"milestone": "staging", "subtask": "staging_deploy", "checked": true}
  ✓ Milestone "Development" complete. Auto-advanced to "Staging".`;

  const API_SNIPPET = `curl -X POST "https://waypoint-bd.vercel.app/api/v1/rows/ZT-4821/subtasks" \\
  -H "Authorization: Bearer wp_live_8f3a9..." \\
  -H "Idempotency-Key: ZT-4821-staging-verify-20260821" \\
  -H "Content-Type: application/json" \\
  -d '{
    "milestone": "staging",
    "subtask": "staging_verify",
    "checked": true
  }'

# Response (200 OK):
{
  "row": {
    "identityRef": "ZT-4821",
    "currentMilestone": "qa",
    "progressPercent": 60,
    "completedMilestones": ["triage", "development", "staging"]
  }
}`;

  const LLMSTXT_SNIPPET = `# Waypoint Instructions for AI Agents (Served live at /llms.txt)

Waypoint is a personal status tracker acting as external memory.
You do real work in Jira, GitHub, and local repos, then MIRROR status into Waypoint.

## Core Directives:
1. Never write card contents, customer data, or credentials into Waypoint. Refs only.
2. Never tick a sub-task that didn't happen. False tick = corrupted memory.
3. Respect 'humanUsual: true' flags — tick only when user explicitly confirms.
4. Always pass 'Idempotency-Key' header on write requests for safe replays.`;

  const getActiveCode = () => {
    switch (activeTab) {
      case "prompt":
        return PROMPT_SNIPPET;
      case "api":
        return API_SNIPPET;
      case "llmstxt":
        return LLMSTXT_SNIPPET;
    }
  };

  return (
    <div className="w-full rounded-2xl border border-edge bg-surface shadow-card overflow-hidden">
      {/* Code Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-edge bg-surface-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>

          <button
            onClick={() => setActiveTab("prompt")}
            className={`rounded-lg px-3 py-1 text-xs font-mono transition cursor-pointer ${
              activeTab === "prompt"
                ? "bg-surface font-semibold text-accent shadow-xs border border-edge"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Pair-Agent Dialogue
          </button>
          <button
            onClick={() => setActiveTab("api")}
            className={`rounded-lg px-3 py-1 text-xs font-mono transition cursor-pointer ${
              activeTab === "api"
                ? "bg-surface font-semibold text-accent shadow-xs border border-edge"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Deterministic API
          </button>
          <button
            onClick={() => setActiveTab("llmstxt")}
            className={`rounded-lg px-3 py-1 text-xs font-mono transition cursor-pointer ${
              activeTab === "llmstxt"
                ? "bg-surface font-semibold text-accent shadow-xs border border-edge"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Live /llms.txt
          </button>
        </div>

        <button
          onClick={() => copySnippet(getActiveCode())}
          className="flex items-center gap-1.5 rounded-md border border-edge bg-surface px-2.5 py-1 text-[11.5px] font-mono text-ink-muted hover:border-edge-strong hover:text-ink transition cursor-pointer"
        >
          {copied ? (
            <>
              <CheckIcon className="h-3 w-3 text-done" />
              <span className="text-done font-medium">Copied</span>
            </>
          ) : (
            <>
              <CopyIcon className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-5 sm:p-6 bg-surface font-mono text-xs sm:text-[12.5px] leading-relaxed overflow-x-auto">
        <pre className="text-ink">
          <code>{getActiveCode()}</code>
        </pre>
      </div>

      {/* Value Prop Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-edge bg-surface-2/60 text-xs">
        <div className="p-4 border-b sm:border-b-0 sm:border-r border-edge">
          <div className="font-serif font-semibold text-ink">Personal Access Tokens</div>
          <p className="text-ink-muted text-[11.5px] mt-0.5">Scoped `read` and `read,write` keys created instantly in Settings.</p>
        </div>
        <div className="p-4 border-b sm:border-b-0 sm:border-r border-edge">
          <div className="font-serif font-semibold text-ink">Idempotency-Safe</div>
          <p className="text-ink-muted text-[11.5px] mt-0.5">Repeated network retries return cached result with `Idempotency-Replayed`.</p>
        </div>
        <div className="p-4">
          <div className="font-serif font-semibold text-ink">Zero Data Leakage</div>
          <p className="text-ink-muted text-[11.5px] mt-0.5">Only card IDs are stored. Card titles and customer text never touch Waypoint.</p>
        </div>
      </div>
    </div>
  );
}
