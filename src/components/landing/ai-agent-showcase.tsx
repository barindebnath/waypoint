"use client";

import { useState, type ReactNode } from "react";
import { KeyIcon } from "@/components/icons";
import { btnPill } from "@/components/ui";
import { CopyIcon, CheckIcon, CheckCircleIcon, RefreshIcon, ShieldCheckIcon, SparklesIcon } from "./icons";

type CodeTab = "prompt" | "api" | "llmstxt";

const TABS: { key: CodeTab; label: string }[] = [
  { key: "prompt", label: "Pair Dialogue" },
  { key: "api", label: "REST API" },
  { key: "llmstxt", label: "/llms.txt" },
];

/** A short piece of code inside a line of text. */
function Code({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-surface-3 px-1.5 py-0.5 font-mono text-[11.5px] text-ink">{children}</code>;
}

export function AiAgentShowcase() {
  const [activeTab, setActiveTab] = useState<CodeTab>("prompt");
  const [copied, setCopied] = useState(false);

  const copySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const PROMPT_RAW = `Developer: "I just raised PR #142 for ZT-4821 and verified the fix in staging."

AI Agent:
  → Reads instructions from /llms.txt
  → POST /api/v1/rows/ZT-4821/refs {"action": "add", "ref": "web-client#142"}
  → POST /api/v1/rows/ZT-4821/subtasks {"milestone": "development", "subtask": "pr_raised", "checked": true}
  → POST /api/v1/rows/ZT-4821/subtasks {"milestone": "staging", "subtask": "staging_deploy", "checked": true}
  ✓ Milestone "Development" complete. Auto-advanced to "Staging".`;

  const API_RAW = `curl -X POST "https://waypoint.dev/api/v1/rows/ZT-4821/subtasks" \\
  -H "Authorization: Bearer wp_live_8f3a9..." \\
  -H "Idempotency-Key: ZT-4821-staging-verify-20260821" \\
  -H "Content-Type: application/json" \\
  -d '{
    "milestone": "staging",
    "subtask": "staging_verify",
    "checked": true
  }'`;

  const LLMSTXT_RAW = `# Waypoint Instructions for AI Agents (/llms.txt)

1. Never write card contents, customer data, or secrets into Waypoint. Refs only.
2. Never tick a sub-task that didn't happen. False tick = corrupted memory.
3. Always send an Idempotency-Key header on writes.`;

  return (
    <div className="w-full rounded-3xl bg-surface p-3 sm:p-4">
      {/* Toolbar: the snippet tabs and the copy button */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3 pt-1">
        <div role="group" aria-label="Snippet" className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-surface-2 p-1">
          {TABS.map((tab) => {
            const on = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={on}
                onClick={() => setActiveTab(tab.key)}
                className={`h-8 shrink-0 cursor-pointer rounded-full px-3.5 font-mono text-xs transition-colors ${
                  on ? "bg-accent font-semibold text-accent-ink" : "text-ink-muted hover:bg-surface-3 hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() =>
            copySnippet(
              activeTab === "prompt" ? PROMPT_RAW : activeTab === "api" ? API_RAW : LLMSTXT_RAW
            )
          }
          className={btnPill}
        >
          {copied ? (
            <>
              <CheckIcon className="h-3.5 w-3.5 text-done" />
              <span className="text-done">Copied</span>
            </>
          ) : (
            <>
              <CopyIcon className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Formatted Code Block */}
      <div className="overflow-x-auto rounded-2xl bg-surface-2 p-4 font-mono text-xs leading-relaxed sm:p-6 sm:text-[12.5px]">
        {activeTab === "prompt" && (
          <div className="space-y-4">
            <div>
              <span className="font-semibold text-accent-fg">Developer:</span>{" "}
              <span className="text-ink">
                &quot;I just raised PR #142 for ZT-4821 and verified the fix in staging.&quot;
              </span>
            </div>
            <div className="space-y-1.5 rounded-xl bg-surface p-4 text-[12px]">
              <div className="flex items-center gap-2 font-semibold text-done">
                <SparklesIcon className="h-4 w-4" />
                <span>AI Agent (via /llms.txt):</span>
              </div>
              <p className="text-[11.5px] text-ink-muted">
                Reading instructions from <code className="text-accent-fg">/llms.txt</code>...
              </p>
              <div className="space-y-1.5 pt-1 text-[11px] text-ink-muted">
                <div>
                  <span className="font-semibold text-product">POST</span> /api/v1/rows/ZT-4821/refs{" "}
                  <span className="text-ink-faint">&#123;&quot;ref&quot;: &quot;web-client#142&quot;&#125;</span>
                </div>
                <div>
                  <span className="font-semibold text-product">POST</span> /api/v1/rows/ZT-4821/subtasks{" "}
                  <span className="text-ink-faint">&#123;&quot;milestone&quot;: &quot;development&quot;, &quot;subtask&quot;: &quot;pr_raised&quot;, &quot;checked&quot;: true&#125;</span>
                </div>
                <div>
                  <span className="font-semibold text-product">POST</span> /api/v1/rows/ZT-4821/subtasks{" "}
                  <span className="text-ink-faint">&#123;&quot;milestone&quot;: &quot;staging&quot;, &quot;subtask&quot;: &quot;staging_deploy&quot;, &quot;checked&quot;: true&#125;</span>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-2 text-xs font-medium text-done">
                <CheckCircleIcon className="mt-px h-4 w-4 shrink-0" />
                <span>Milestone &quot;Development&quot; complete. Auto-advanced to &quot;Staging&quot;.</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "api" && (
          <div className="space-y-1 text-ink">
            <div>
              <span className="font-semibold text-product">curl</span> -X POST{" "}
              <span className="text-done">&quot;https://waypoint-bd.vercel.app/api/v1/rows/ZT-4821/subtasks&quot;</span> \
            </div>
            <div className="pl-4 text-ink-muted">
              -H <span className="text-support-light">&quot;Authorization: Bearer wp_live_8f3a9...&quot;</span> \
            </div>
            <div className="pl-4 text-ink-muted">
              -H <span className="text-support-light">&quot;Idempotency-Key: ZT-4821-staging-verify-20260821&quot;</span> \
            </div>
            <div className="pl-4 text-ink-muted">
              -H <span className="text-support-light">&quot;Content-Type: application/json&quot;</span> \
            </div>
            <div className="pl-4 text-ink">
              -d <span className="text-support">&#39;&#123;</span>
            </div>
            <div className="pl-8 text-ink">
              <span className="text-accent-fg">&quot;milestone&quot;</span>: <span className="text-done">&quot;staging&quot;</span>,
            </div>
            <div className="pl-8 text-ink">
              <span className="text-accent-fg">&quot;subtask&quot;</span>: <span className="text-done">&quot;staging_verify&quot;</span>,
            </div>
            <div className="pl-8 text-ink">
              <span className="text-accent-fg">&quot;checked&quot;</span>: <span className="font-semibold text-product">true</span>
            </div>
            <div className="pl-4 text-ink">
              <span className="text-support">&#125;&#39;</span>
            </div>
          </div>
        )}

        {activeTab === "llmstxt" && (
          <div className="space-y-3 text-ink">
            <div className="border-b border-edge pb-2 text-sm font-semibold text-accent-fg">
              # Waypoint System Directives for AI Agents
            </div>
            <p className="text-xs text-ink-muted">
              Waypoint is a personal status tracker acting as external memory.
            </p>
            <ol className="list-inside list-decimal space-y-1.5 text-xs">
              <li>
                <strong className="text-ink">Refs only:</strong> Never write card contents, customer data, or secrets into Waypoint.
              </li>
              <li>
                <strong className="text-ink">Honest memory:</strong> Never tick a sub-task that didn&apos;t happen in reality.
              </li>
              <li>
                <strong className="text-ink">Idempotency:</strong> Always send an <code className="text-accent-fg">Idempotency-Key</code> header on writes.
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Feature Footnotes */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface-2 p-4">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-chip-yellow text-chip-ink">
            <KeyIcon className="h-4 w-4" />
          </span>
          <div className="mt-3 text-[13px] font-semibold text-ink">Personal API Tokens</div>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Scoped <Code>read</Code> &amp; <Code>read,write</Code> keys created in Settings.
          </p>
        </div>
        <div className="rounded-2xl bg-surface-2 p-4">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-chip-sky text-chip-ink">
            <RefreshIcon className="h-4 w-4" />
          </span>
          <div className="mt-3 text-[13px] font-semibold text-ink">Idempotency Safe</div>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">Network retries replay cached result automatically.</p>
        </div>
        <div className="rounded-2xl bg-surface-2 p-4">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-chip-mint text-chip-ink">
            <ShieldCheckIcon className="h-4 w-4" />
          </span>
          <div className="mt-3 text-[13px] font-semibold text-ink">Zero Data Leakage</div>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">Only card IDs stored. No customer text transmitted.</p>
        </div>
      </div>
    </div>
  );
}
