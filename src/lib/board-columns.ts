import type { EnrichedRowView } from "./client-api";

/**
 * The Board columns. Pipelines differ, so a column groups milestone keys by meaning, not by index.
 * Support-light skips Staging and QA: its Close-out lands in column 5.
 */
export const COLUMNS: { title: string; keys: string[] }[] = [
  { title: "Triage / Definition", keys: ["triage", "definition"] },
  { title: "Development", keys: ["development", "resolution"] },
  { title: "Staging", keys: ["staging"] },
  { title: "QA & Review", keys: ["qa_review"] },
  { title: "Production & Close-out", keys: ["prod_close", "closeout"] },
];

export function columnIndex(row: EnrichedRowView): number {
  const idx = COLUMNS.findIndex((c) => c.keys.includes(row.currentMilestone));
  if (idx !== -1) return idx;
  // If a pipeline gets a new milestone key, place it by its position in the pipeline.
  const pos = row.milestones.findIndex((m) => m.key === row.currentMilestone);
  return Math.min(Math.max(pos, 0), COLUMNS.length - 1);
}
