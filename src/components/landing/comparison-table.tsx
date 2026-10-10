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
    waypoint: "Timesheet bar on the Board + one-click AutoTempo fill",
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
    <div className="w-full overflow-hidden rounded-3xl bg-surface">
      <div className="p-5 sm:p-7">
        <h3 className="font-serif text-xl font-semibold tracking-tight text-ink">
          Why Waypoint?
        </h3>
        <p className="mt-1.5 text-[13px] text-ink-muted">
          Designed specifically as external memory for individual engineers who ship code.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-y border-edge/70 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              <th scope="col" className="w-1/4 p-4 sm:px-7">Feature</th>
              <th scope="col" className="w-1/3 bg-accent-soft p-4 text-accent-fg sm:px-7">Waypoint</th>
              <th scope="col" className="w-1/4 p-4 sm:px-7">Jira / Linear</th>
              <th scope="col" className="w-1/4 p-4 sm:px-7">Spreadsheets / Notion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge/60">
            {ROWS.map((r) => (
              <tr key={r.feature} className="transition-colors hover:bg-surface-2/60">
                <td className="p-4 align-top font-medium text-ink sm:px-7">
                  {r.feature}
                </td>
                <td className="bg-accent-soft p-4 align-top font-medium text-ink sm:px-7">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    <span>{r.waypoint}</span>
                  </div>
                </td>
                <td className="p-4 align-top text-ink-muted sm:px-7">
                  {r.jiraLinear}
                </td>
                <td className="p-4 align-top text-ink-muted sm:px-7">
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
