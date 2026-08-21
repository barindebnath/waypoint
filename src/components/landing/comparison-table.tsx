"use client";

import { CheckIcon } from "./icons";

type ComparisonRow = {
  feature: string;
  waypoint: string;
  jiraLinear: string;
  spreadsheets: string;
};

const ROWS: ComparisonRow[] = [
  {
    feature: "Data Model",
    waypoint: "Deterministic milestone pipelines with sub-task checklists",
    jiraLinear: "Complex customizable workflows with arbitrary states",
    spreadsheets: "Unstructured freeform rows and loose notes",
  },
  {
    feature: "Customer Privacy & Security",
    waypoint: "References only (ZT-1234) — zero customer text stored",
    jiraLinear: "Stores full ticket descriptions, customer data, and attachments",
    spreadsheets: "High risk of accidental copy-pasted customer PII",
  },
  {
    feature: "AI Agent Native (/llms.txt)",
    waypoint: "Live /llms.txt instructions + Idempotency-Key REST API",
    jiraLinear: "Heavy OAuth/GraphQL or MCP configurations required",
    spreadsheets: "Manual copy-pasting required",
  },
  {
    feature: "Status Syncing",
    waypoint: "Automatic background fan-out sync for GitHub PRs & Jira",
    jiraLinear: "Manual column dragging or complex automation bots",
    spreadsheets: "Instantly out of date without manual edits",
  },
  {
    feature: "Timesheet & Tempo",
    waypoint: "Daily 5-day Mon–Fri attestation + AutoTempo rules",
    jiraLinear: "Heavy third-party plugin with daily friction",
    spreadsheets: "End-of-week memory reconstruction panic",
  },
  {
    feature: "Cognitive Load",
    waypoint: "Zero comment threads, zero email notifications, instant load",
    jiraLinear: "High notification noise, endless status comments",
    spreadsheets: "High maintenance formatting overhead",
  },
];

export function ComparisonTable() {
  return (
    <div className="w-full rounded-2xl border border-edge bg-surface shadow-card overflow-hidden">
      <div className="border-b border-edge bg-surface-2 p-5 sm:p-6">
        <h3 className="font-serif text-lg font-semibold text-ink">
          Why Waypoint?
        </h3>
        <p className="text-xs text-ink-muted mt-1">
          Designed specifically as external memory for individual engineers who ship code.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-edge bg-surface-2/40 font-mono text-[11px] text-ink-muted uppercase tracking-wider">
              <th className="p-4 sm:px-6 w-1/4">Feature</th>
              <th className="p-4 sm:px-6 w-1/3 bg-accent-soft/30 text-accent font-semibold">Waypoint</th>
              <th className="p-4 sm:px-6 w-1/4">Jira / Linear</th>
              <th className="p-4 sm:px-6 w-1/4">Spreadsheets / Notion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {ROWS.map((r) => (
              <tr key={r.feature} className="hover:bg-surface-2/40 transition">
                <td className="p-4 sm:px-6 font-medium text-ink align-top">
                  {r.feature}
                </td>
                <td className="p-4 sm:px-6 bg-accent-soft/20 font-medium text-ink align-top">
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent !text-accent-ink text-[10px] mt-0.5 font-bold">
                      ✓
                    </span>
                    <span>{r.waypoint}</span>
                  </div>
                </td>
                <td className="p-4 sm:px-6 text-ink-muted align-top">
                  {r.jiraLinear}
                </td>
                <td className="p-4 sm:px-6 text-ink-muted align-top">
                  {r.spreadsheets}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
