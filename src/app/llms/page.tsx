"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Chip } from "@/components/chip";
import { ArrowRightIcon, ArrowUpRightIcon, BookIcon, CheckIcon, InfoIcon, SparkleIcon } from "@/components/icons";
import { LogoTile } from "@/components/logo";
import { Spinner } from "@/components/spinner";
import { btnGhost, btnPill, btnPrimary, btnSecondary } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

/* ------------------------------------------------------------------ */
/* Two local icons                                                      */
/* ------------------------------------------------------------------ */

/**
 * The shared icon set has no copy icon and no file icon, so the page defines them here.
 * They use the same style as the set: a 24px grid, stroke 1.7, round caps and round joins.
 */
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="9" y="9" width="11" height="11" rx="3.5" />
      <path d="M15 9V7.5A3.5 3.5 0 0 0 11.5 4h-4A3.5 3.5 0 0 0 4 7.5v4A3.5 3.5 0 0 0 7.5 15H9" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M14 3.5H8.5A3.5 3.5 0 0 0 5 7v10a3.5 3.5 0 0 0 3.5 3.5h7A3.5 3.5 0 0 0 19 17V8.5z" />
      <path d="M14 3.5V7a1.5 1.5 0 0 0 1.5 1.5H19M9 13h6M9 16.5h4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Copy button                                                          */
/* ------------------------------------------------------------------ */

/** The classes of the copy button for the two seconds after a copy. It is a solid mint pill with dark text. */
const COPIED_CLASS =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-chip-mint px-4 text-[13px] font-semibold text-chip-ink transition";

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
    <button type="button" onClick={copy} className={state === "copied" ? COPIED_CLASS : btnSecondary}>
      {state === "copied" ? (
        <>
          <CheckIcon className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <CopyIcon className="h-4 w-4" />
          Copy llms.txt
        </>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Inline markdown renderer (no external deps)                         */
/* ------------------------------------------------------------------ */

/** The HTTP methods. A table cell with one of these words becomes a method pill. */
const VERBS = ["GET", "POST", "PATCH", "DELETE"];

/** The colours of each method pill. They are the same as on the docs page. */
const VERB_TONE: Record<string, string> = {
  GET: "bg-chip-mint text-chip-ink",
  POST: "bg-chip-yellow text-chip-ink",
  PATCH: "bg-accent text-accent-ink",
  DELETE: "bg-chip-salmon text-chip-ink",
};

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
        return <code key={pi} className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-accent-fg ring-1 ring-edge">{p.slice(1, -1)}</code>;
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
        <pre key={key++} className="my-4 overflow-x-auto rounded-2xl bg-surface-2 p-4 font-mono text-[13px] leading-relaxed text-ink">
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
        <div key={key++} className="my-4 overflow-x-auto rounded-2xl ring-1 ring-edge">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-2">
                {parseCells(header).map((h, hi) => (
                  <th key={hi} className="px-4 py-2.5 text-left font-mono text-[10.5px] font-medium uppercase tracking-wider text-ink-faint">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className="border-t border-edge/60 transition-colors hover:bg-surface-2/50">
                  {parseCells(row).map((cell, ci) => {
                    // The first cell can be a method, a code span or a sentence. Each has its own look.
                    if (ci === 0 && VERBS.includes(cell)) {
                      return (
                        <td key={ci} className="px-4 py-2.5 align-top">
                          <span
                            className={`inline-flex h-6 items-center rounded-full px-2.5 font-mono text-[11px] font-bold leading-none tracking-wide ${VERB_TONE[cell]}`}
                          >
                            {cell}
                          </span>
                        </td>
                      );
                    }
                    const look =
                      ci > 0
                        ? "text-ink-muted"
                        : cell.startsWith("`")
                          ? "whitespace-nowrap font-mono text-[12px] text-accent-fg"
                          : "text-ink";
                    return (
                      <td key={ci} className={`px-4 py-2.5 align-top ${look}`}>
                        {inlineStyle(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={key++} className="mb-2 mt-6 font-serif text-base font-semibold tracking-tight text-ink">
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={key++} className="mb-3 mt-10 border-b border-edge/60 pb-2.5 font-serif text-xl font-semibold tracking-tight text-ink first:mt-0">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      nodes.push(
        <h1 key={key++} className="mb-4 mt-0 font-serif text-[28px] font-semibold leading-tight tracking-tight text-ink">
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
        <ol key={key++} className="my-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-muted marker:text-ink-faint">
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
        <ul key={key++} className="my-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-muted marker:text-ink-faint">
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

    // Paragraph. The loop always takes the first line, so the index always moves forward.
    // A line such as "#### x" has no branch of its own, and without this rule the loop would never end.
    const paraLines: string[] = [line];
    i++;
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
    nodes.push(
      <p key={key++} className="my-2 text-sm leading-relaxed text-ink-muted">
        {inlineStyle(paraLines.join(" "))}
      </p>
    );
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
    <div className="min-h-screen bg-desk">
      {/*
        Header. The band is a strip of desk colour. It hides the page that scrolls behind the bar.
        It sticks to the top from the sm width. On a narrow screen it does not stick, and the bar can have two rows.
      */}
      <div className="bg-desk px-2.5 pb-3 pt-2.5 sm:sticky sm:top-0 sm:z-40 sm:px-3 sm:pt-3">
        <header className="mx-auto flex min-h-14 max-w-4xl flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl bg-bg py-2 pl-3 pr-2">
          <Link href="/" className="flex items-center gap-2.5 text-ink">
            <LogoTile className="h-9 w-9" />
            <span className="font-serif text-lg font-semibold tracking-tight">Waypoint</span>
          </Link>
          <nav aria-label="Site" className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <span className="hidden sm:inline-flex">
              <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className={btnPill}>
                raw
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </a>
            </span>
            <Link href="/docs" className={btnPill}>
              <BookIcon className="h-3.5 w-3.5 text-accent-fg" />
              API docs
            </Link>
            {session ? (
              <Link href="/board" className={btnSecondary}>
                Board
              </Link>
            ) : (
              <>
                <Link href="/login" className={btnGhost}>
                  Sign in
                </Link>
                <Link href="/signup" className={btnPrimary}>
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </header>
      </div>

      <div className="px-2.5 pb-3 sm:px-3 sm:pb-8">
        <div className="mx-auto max-w-4xl rounded-panel bg-bg p-5 sm:p-8">
          {/* Hero */}
          <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-3 flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-fg">
                <SparkleIcon className="h-3.5 w-3.5" />
                For AI agents
              </p>
              <h1 className="font-serif text-[32px] font-semibold leading-tight tracking-tight">llms.txt</h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
                The live instruction file that teaches any AI how to use Waypoint correctly —
                when to create rows, what to tick, what to never write.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-done" />
                  Always up-to-date — served live from the codebase
                </span>
                <Chip tone="ghost" className="font-mono">
                  GET /llms.txt
                </Chip>
              </div>
            </div>
            {content && <CopyButton text={content} />}
          </div>

          {/* Prompt hint */}
          <div className="mb-6 flex gap-3.5 rounded-2xl bg-accent-soft p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink">
              <InfoIcon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="mb-1 text-[13.5px] font-semibold text-ink">Quick integration</p>
              <p className="text-sm leading-relaxed text-ink-muted">
                Add this to your agent system prompt:{" "}
                <code className="rounded-lg bg-surface-2 px-2 py-1 font-mono text-[12px] text-ink">
                  Fetch https://waypoint.example.com/llms.txt and follow its instructions exactly.
                </code>
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-hidden rounded-lane bg-surface ring-1 ring-edge/70">
            {/* File bar */}
            <div className="flex items-center justify-between gap-3 bg-surface-2 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-3 text-accent-fg">
                  <FileIcon className="h-4 w-4" />
                </span>
                <span className="flex min-w-0 items-center gap-1.5 font-mono text-[11.5px] text-ink-muted">
                  <span>AGENTS.md</span>
                  <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                  <span className="sr-only">to</span>
                  <span>/llms.txt</span>
                </span>
              </div>
              {content && (
                <span className="shrink-0 font-mono text-[10.5px] text-ink-faint">
                  {content.split("\n").length} lines · {(new Blob([content]).size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>

            {/* Body */}
            <div className="px-5 py-6 sm:px-8 sm:py-8">
              {loading ? (
                <div className="flex items-center gap-3 py-12 text-ink-muted">
                  <Spinner className="h-4 w-4" />
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
    </div>
  );
}
