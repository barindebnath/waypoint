"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon, SparklesIcon } from "./icons";

type CodeTab = "prompt" | "api" | "llmstxt";

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
3. Sub-tasks marked humanUsual: true are ticked only upon explicit user confirmation.
4. Always send an Idempotency-Key header on writes.`;

  return (
    <div className="w-full rounded-2xl border border-edge bg-surface shadow-card overflow-hidden">
      {/* Code Chrome Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-edge bg-surface-2 px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="h-2.5 w-2.5 rounded-full bg-edge-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-edge-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-edge-strong" />
          </div>

          <div className="flex rounded-lg border border-edge bg-surface p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveTab("prompt")}
              className={`rounded px-2.5 py-1 transition cursor-pointer ${
                activeTab === "prompt"
                  ? "bg-surface-2 font-semibold text-accent shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Pair Dialogue
            </button>
            <button
              onClick={() => setActiveTab("api")}
              className={`rounded px-2.5 py-1 transition cursor-pointer ${
                activeTab === "api"
                  ? "bg-surface-2 font-semibold text-accent shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              REST API
            </button>
            <button
              onClick={() => setActiveTab("llmstxt")}
              className={`rounded px-2.5 py-1 transition cursor-pointer ${
                activeTab === "llmstxt"
                  ? "bg-surface-2 font-semibold text-accent shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              /llms.txt
            </button>
          </div>
        </div>

        <button
          onClick={() =>
            copySnippet(
              activeTab === "prompt" ? PROMPT_RAW : activeTab === "api" ? API_RAW : LLMSTXT_RAW
            )
          }
          className="flex items-center gap-1.5 rounded-md border border-edge bg-surface px-2.5 py-1 text-[11px] font-mono text-ink-muted hover:border-edge-strong hover:text-ink transition cursor-pointer"
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

      {/* Formatted Code Block */}
      <div className="p-5 sm:p-6 bg-surface font-mono text-xs sm:text-[12.5px] leading-relaxed overflow-x-auto">
        {activeTab === "prompt" && (
          <div className="space-y-4">
            <div>
              <span className="font-semibold text-accent">Developer:</span>{" "}
              <span className="text-ink">
                &quot;I just raised PR #142 for ZT-4821 and verified the fix in staging.&quot;
              </span>
            </div>
            <div className="rounded-xl border border-edge bg-surface-2 p-4 space-y-1.5 text-[12px]">
              <div className="flex items-center gap-2 font-semibold text-done">
                <SparklesIcon className="h-3.5 w-3.5" />
                <span>AI Agent (via /llms.txt):</span>
              </div>
              <p className="text-ink-muted text-[11.5px]">
                Reading instructions from <code className="text-accent">/llms.txt</code>...
              </p>
              <div className="text-ink-muted space-y-1 pt-1 font-mono text-[11px]">
                <div>
                  <span className="text-purple-600 dark:text-purple-400">POST</span> /api/v1/rows/ZT-4821/refs{" "}
                  <span className="text-ink-faint">&#123;&quot;ref&quot;: &quot;web-client#142&quot;&#125;</span>
                </div>
                <div>
                  <span className="text-purple-600 dark:text-purple-400">POST</span> /api/v1/rows/ZT-4821/subtasks{" "}
                  <span className="text-ink-faint">&#123;&quot;milestone&quot;: &quot;development&quot;, &quot;subtask&quot;: &quot;pr_raised&quot;, &quot;checked&quot;: true&#125;</span>
                </div>
                <div>
                  <span className="text-purple-600 dark:text-purple-400">POST</span> /api/v1/rows/ZT-4821/subtasks{" "}
                  <span className="text-ink-faint">&#123;&quot;milestone&quot;: &quot;staging&quot;, &quot;subtask&quot;: &quot;staging_deploy&quot;, &quot;checked&quot;: true&#125;</span>
                </div>
              </div>
              <div className="pt-2 text-done font-medium text-xs">
                ✓ Milestone &quot;Development&quot; complete. Auto-advanced to &quot;Staging&quot;.
              </div>
            </div>
          </div>
        )}

        {activeTab === "api" && (
          <div className="space-y-1 text-ink">
            <div>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">curl</span> -X POST{" "}
              <span className="text-done">&quot;https://waypoint-bd.vercel.app/api/v1/rows/ZT-4821/subtasks&quot;</span> \
            </div>
            <div className="pl-4 text-ink-muted">
              -H <span className="text-blue-600 dark:text-blue-400">&quot;Authorization: Bearer wp_live_8f3a9...&quot;</span> \
            </div>
            <div className="pl-4 text-ink-muted">
              -H <span className="text-blue-600 dark:text-blue-400">&quot;Idempotency-Key: ZT-4821-staging-verify-20260821&quot;</span> \
            </div>
            <div className="pl-4 text-ink-muted">
              -H <span className="text-blue-600 dark:text-blue-400">&quot;Content-Type: application/json&quot;</span> \
            </div>
            <div className="pl-4 text-ink">
              -d <span className="text-amber-600 dark:text-amber-400">&#39;&#123;</span>
            </div>
            <div className="pl-8 text-ink">
              <span className="text-accent">&quot;milestone&quot;</span>: <span className="text-done">&quot;staging&quot;</span>,
            </div>
            <div className="pl-8 text-ink">
              <span className="text-accent">&quot;subtask&quot;</span>: <span className="text-done">&quot;staging_verify&quot;</span>,
            </div>
            <div className="pl-8 text-ink">
              <span className="text-accent">&quot;checked&quot;</span>: <span className="text-purple-600 dark:text-purple-400 font-semibold">true</span>
            </div>
            <div className="pl-4 text-ink">
              <span className="text-amber-600 dark:text-amber-400">&#125;&#39;</span>
            </div>
          </div>
        )}

        {activeTab === "llmstxt" && (
          <div className="space-y-3 text-ink">
            <div className="font-serif text-sm font-semibold text-accent border-b border-edge pb-1">
              # Waypoint System Directives for AI Agents
            </div>
            <p className="text-ink-muted text-xs">
              Waypoint is a personal status tracker acting as external memory.
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs">
              <li>
                <strong className="text-ink">Refs only:</strong> Never write card contents, customer data, or secrets into Waypoint.
              </li>
              <li>
                <strong className="text-ink">Honest memory:</strong> Never tick a sub-task that didn&apos;t happen in reality.
              </li>
              <li>
                <strong className="text-ink">humanUsual flag:</strong> Tasks marked <code>humanUsual: true</code> require explicit user confirmation.
              </li>
              <li>
                <strong className="text-ink">Idempotency:</strong> Always send an <code>Idempotency-Key</code> header on writes.
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Feature Footnotes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-edge bg-surface-2 text-xs">
        <div className="p-3.5 sm:p-4 border-b sm:border-b-0 sm:border-r border-edge">
          <div className="font-serif font-semibold text-ink text-xs">Personal API Tokens</div>
          <p className="text-ink-muted text-[11px] mt-0.5">Scoped `read` & `read,write` keys created in Settings.</p>
        </div>
        <div className="p-3.5 sm:p-4 border-b sm:border-b-0 sm:border-r border-edge">
          <div className="font-serif font-semibold text-ink text-xs">Idempotency Safe</div>
          <p className="text-ink-muted text-[11px] mt-0.5">Network retries replay cached result automatically.</p>
        </div>
        <div className="p-3.5 sm:p-4">
          <div className="font-serif font-semibold text-ink text-xs">Zero Data Leakage</div>
          <p className="text-ink-muted text-[11px] mt-0.5">Only card IDs stored. No customer text transmitted.</p>
        </div>
      </div>
    </div>
  );
}
