"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";

/* ------------------------------------------------------------------ */
/* Copy button                                                          */
/* ------------------------------------------------------------------ */
function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      /* fallback: ignored */
    }
  };

  return (
    <button
      onClick={copy}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
        state === "copied"
          ? "border-done/60 bg-done/10 text-done"
          : "border-edge bg-surface hover:border-edge-strong hover:bg-surface-2 text-ink"
      }`}
    >
      {state === "copied" ? (
        <>
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Copy llms.txt
        </>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Inline markdown renderer (no external deps)                         */
/* ------------------------------------------------------------------ */
function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const inlineStyle = (text: string): React.ReactNode => {
    // bold **text**, inline code `text`
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((p, pi) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={pi} className="font-semibold text-ink">{p.slice(2, -2)}</strong>;
      }
      if (p.startsWith("`") && p.endsWith("`")) {
        return <code key={pi} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[12px] text-live border border-edge">{p.slice(1, -1)}</code>;
      }
      return p;
    });
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre key={key++} className="my-4 overflow-x-auto rounded-xl border border-edge bg-surface-2 p-4 font-mono text-[13px] leading-relaxed text-ink">
          {codeLines.join("\n")}
        </pre>
      );
      i++;
      continue;
    }

    // Table
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      // Filter separator rows
      const rows = tableLines.filter((l) => !l.match(/^\|[\s\-:]+\|/));
      const [header, ...body] = rows;
      const parseCells = (l: string) =>
        l
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());

      nodes.push(
        <div key={key++} className="my-4 overflow-x-auto rounded-xl border border-edge">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-2">
                {parseCells(header).map((h, hi) => (
                  <th key={hi} className="border-b border-edge px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-ink-faint font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className="border-b border-edge last:border-0 hover:bg-surface-2/50 transition-colors">
                  {parseCells(row).map((cell, ci) => (
                    <td key={ci} className={`px-4 py-2.5 ${ci === 0 ? "font-mono text-live text-[12px] whitespace-nowrap" : "text-ink-muted"}`}>
                      {inlineStyle(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={key++} className="mb-3 mt-12 font-serif text-xl font-medium tracking-tight text-ink first:mt-0 border-b border-edge/60 pb-2">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      nodes.push(
        <h1 key={key++} className="mb-4 mt-0 font-serif text-3xl font-medium tracking-tight text-ink">
          {line.slice(2)}
        </h1>
      );
      i++;
      continue;
    }

    // Ordered list item
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push(
        <ol key={key++} className="my-3 list-decimal space-y-1.5 pl-5 text-sm text-ink-muted">
          {listItems.map((item, ii) => (
            <li key={ii}>{inlineStyle(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Unordered list item (including indented continuation lines)
    if (line.startsWith("- ")) {
      const listItems: { text: string; sub: string[] }[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("  "))) {
        if (lines[i].startsWith("- ")) {
          listItems.push({ text: lines[i].slice(2), sub: [] });
        } else if (listItems.length > 0) {
          listItems[listItems.length - 1].sub.push(lines[i].trim());
        }
        i++;
      }
      nodes.push(
        <ul key={key++} className="my-3 list-disc space-y-1.5 pl-5 text-sm text-ink-muted">
          {listItems.map((item, ii) => (
            <li key={ii}>
              {inlineStyle(item.text)}
              {item.sub.length > 0 && (
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {item.sub.map((s, si) => (
                    <li key={si}>{inlineStyle(s.replace(/^-\s/, ""))}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("- ") &&
      !lines[i].startsWith("|") &&
      !lines[i].startsWith("```") &&
      !/^\d+\.\s/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      nodes.push(
        <p key={key++} className="my-2 text-sm leading-relaxed text-ink-muted">
          {inlineStyle(paraLines.join(" "))}
        </p>
      );
    }
  }

  return nodes;
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function LlmsPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    fetch("/llms.txt")
      .then((r) => r.text())
      .then((t) => {
        setContent(t);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-edge bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5 !text-ink">
            <Logo className="h-6 w-6 -mt-0.5" />
            <span className="font-serif text-lg font-semibold">Waypoint</span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="text-xs text-ink-muted hover:text-ink">
              raw
            </a>
            <Link href="/docs" className="text-xs text-ink-muted hover:text-ink">
              API docs
            </Link>
            {session ? (
              <Link href="/dashboard" className="rounded border border-edge px-2.5 py-1 text-xs text-ink-muted hover:border-edge-strong">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-xs text-ink-muted hover:text-ink">
                  Sign in
                </Link>
                <Link href="/signup" className="rounded bg-accent px-2.5 py-1 text-xs !text-accent-ink hover:opacity-90">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-12">
        {/* Hero */}
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-live">For AI agents</p>
            <h1 className="font-serif text-3xl font-medium tracking-tight">llms.txt</h1>
            <p className="mt-2 max-w-lg text-sm text-ink-muted">
              The live instruction file that teaches any AI how to use Waypoint correctly —
              when to create rows, what to tick, what to never write.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-faint">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-done inline-block" />
                Always up-to-date — served live from the codebase
              </span>
              <span className="font-mono">GET /llms.txt</span>
            </div>
          </div>
          {content && <CopyButton text={content} />}
        </div>

        {/* Prompt hint */}
        <div className="mb-8 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Quick integration</p>
          <p className="text-sm text-ink-muted">
            Add this to your agent system prompt:{" "}
            <code className="rounded bg-surface-2 border border-edge px-1.5 py-0.5 font-mono text-[12px] text-ink">
              Fetch https://waypoint.example.com/llms.txt and follow its instructions exactly.
            </code>
          </p>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-edge bg-surface shadow-card overflow-hidden">
          {/* File bar */}
          <div className="flex items-center justify-between border-b border-edge bg-surface-2 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-danger/40" />
                <span className="h-3 w-3 rounded-full bg-warn/40" />
                <span className="h-3 w-3 rounded-full bg-done/40" />
              </div>
              <span className="font-mono text-[11px] text-ink-muted">AGENTS.md → /llms.txt</span>
            </div>
            {content && (
              <span className="font-mono text-[10px] text-ink-faint">
                {content.split("\n").length} lines · {(new Blob([content]).size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {loading ? (
              <div className="flex items-center gap-3 py-12 text-ink-faint">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span className="text-sm">Loading…</span>
              </div>
            ) : (
              <div>{renderMarkdown(content)}</div>
            )}
          </div>
        </div>

        {/* Footer copy strip */}
        {content && (
          <div className="mt-6 flex justify-center">
            <CopyButton text={content} />
          </div>
        )}
      </div>
    </div>
  );
}
