import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "./db";
import {
  PIPELINES,
  type MilestoneDef,
  type PipelineDef,
  type PipelineKey,
  defaultPipeline,
} from "./pipelines";
import type { ExternalRef } from "./db/schema";

/**
 * The domain engine — the ONE place progress logic lives (spec §5.4), used by
 * both the dashboard and the programmatic API so they can never disagree.
 *
 * Rules encoded here:
 * - A milestone completes when all its sub-tasks are checked; completion
 *   auto-advances the bar (current milestone = first incomplete).
 * - Unchecking a sub-task does NOT un-complete its milestone (creates a
 *   "loose end" instead).
 * - Regression: unchecking a milestone clears all sub-tasks and completion of
 *   that milestone and every milestone after it.
 * - Identity card is unique per user; pipelines are immutable after creation.
 */

/* ------------------------------------------------------------------ */
/* Pipeline definitions (DB-held config, lazily seeded from code)      */
/* ------------------------------------------------------------------ */

export async function loadPipelines(): Promise<Record<PipelineKey, PipelineDef>> {
  const rows = await db.select().from(schema.pipelineDefinition);
  const found = new Map(rows.map((r) => [r.key, r.definition as PipelineDef]));
  const missing = Object.values(PIPELINES).filter((p) => !found.has(p.key));
  if (missing.length > 0) {
    await db
      .insert(schema.pipelineDefinition)
      .values(missing.map((p) => ({ key: p.key, definition: p })))
      .onConflictDoNothing();
    for (const p of missing) found.set(p.key, p);
  }
  return Object.fromEntries(found) as Record<PipelineKey, PipelineDef>;
}

/* ------------------------------------------------------------------ */
/* Ref normalization                                                   */
/* ------------------------------------------------------------------ */

/** Jira-style refs (`pes-11929` → `PES-11929`) uppercase; PR refs (`repo#123`) keep repo casing. */
export function normalizeRef(ref: string): string {
  const trimmed = ref.trim();
  if (trimmed.includes("#")) return trimmed;
  return trimmed.toUpperCase();
}

export function refKind(ref: string): ExternalRef["kind"] {
  if (ref.includes("#")) return "github_pr";
  if (/^[A-Z][A-Z0-9]*-\d+$/i.test(ref.trim())) return "jira";
  return "other";
}

/* ------------------------------------------------------------------ */
/* Row views                                                           */
/* ------------------------------------------------------------------ */

export type SubtaskView = {
  key: string;
  label: string;
  humanUsual: boolean;
  checked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MilestoneView = {
  key: string;
  label: string;
  complete: boolean;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
  subtasks: SubtaskView[];
};

export type RowView = {
  id: string;
  origin: "support" | "product";
  subType: "bug" | "task" | null;
  pipelineKey: PipelineKey;
  pipelineLabel: string;
  identityRef: string;
  identityUrl: string | null;
  secondaryRefs: ExternalRef[];
  currentMilestone: string;
  isComplete: boolean;
  hasLooseEnds: boolean;
  createdAt: string;
  updatedAt: string;
  milestones: MilestoneView[];
};

type RowRecord = typeof schema.ticketRow.$inferSelect;

async function buildViews(userId: string, rows: RowRecord[]): Promise<RowView[]> {
  if (rows.length === 0) return [];
  const pipelines = await loadPipelines();
  const ids = rows.map((r) => r.id);
  const [milestones, subtasks] = await Promise.all([
    db.select().from(schema.milestoneState).where(inArray(schema.milestoneState.rowId, ids)),
    db.select().from(schema.subtaskState).where(inArray(schema.subtaskState.rowId, ids)),
  ]);
  const msByRow = new Map<string, Map<string, (typeof milestones)[number]>>();
  for (const m of milestones) {
    if (!msByRow.has(m.rowId)) msByRow.set(m.rowId, new Map());
    msByRow.get(m.rowId)!.set(m.milestoneKey, m);
  }
  const stByRow = new Map<string, Map<string, (typeof subtasks)[number]>>();
  for (const s of subtasks) {
    if (!stByRow.has(s.rowId)) stByRow.set(s.rowId, new Map());
    stByRow.get(s.rowId)!.set(`${s.milestoneKey}/${s.subtaskKey}`, s);
  }

  return rows.map((row) => {
    const def = pipelines[row.pipelineKey];
    const ms = msByRow.get(row.id) ?? new Map();
    const st = stByRow.get(row.id) ?? new Map();
    let hasLooseEnds = false;
    const milestoneViews: MilestoneView[] = def.milestones.map((mDef: MilestoneDef) => {
      const mState = ms.get(mDef.key);
      const subtaskViews: SubtaskView[] = mDef.subtasks.map((sDef) => {
        const sState = st.get(`${mDef.key}/${sDef.key}`);
        return {
          key: sDef.key,
          label: sDef.label,
          humanUsual: sDef.humanUsual ?? false,
          checked: sState?.checked ?? false,
          createdAt: (sState?.createdAt ?? row.createdAt).toISOString(),
          updatedAt: (sState?.updatedAt ?? row.createdAt).toISOString(),
        };
      });
      return {
        key: mDef.key,
        label: mDef.label,
        complete: mState?.complete ?? false,
        isCurrent: mDef.key === row.currentMilestone && !row.isComplete,
        createdAt: (mState?.createdAt ?? row.createdAt).toISOString(),
        updatedAt: (mState?.updatedAt ?? row.createdAt).toISOString(),
        subtasks: subtaskViews,
      };
    });
    if (row.isComplete) {
      hasLooseEnds = milestoneViews.some((m) => m.subtasks.some((s) => !s.checked));
    }
    return {
      id: row.id,
      origin: row.origin,
      subType: row.subType,
      pipelineKey: row.pipelineKey,
      pipelineLabel: def.label,
      identityRef: row.identityRef,
      identityUrl: row.identityUrl,
      secondaryRefs: row.secondaryRefs,
      currentMilestone: row.currentMilestone,
      isComplete: row.isComplete,
      hasLooseEnds,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      milestones: milestoneViews,
    };
  });
}

export async function listRows(userId: string): Promise<RowView[]> {
  const rows = await db
    .select()
    .from(schema.ticketRow)
    .where(eq(schema.ticketRow.userId, userId))
    .orderBy(asc(schema.ticketRow.createdAt));
  return buildViews(userId, rows);
}

/** Find a row by its identity ref, or fall back to secondary refs. */
export async function findRowByRef(userId: string, ref: string): Promise<RowRecord | null> {
  const norm = normalizeRef(ref);
  const byIdentity = await db
    .select()
    .from(schema.ticketRow)
    .where(and(eq(schema.ticketRow.userId, userId), eq(schema.ticketRow.identityRef, norm)));
  if (byIdentity.length > 0) return byIdentity[0];
  const all = await db
    .select()
    .from(schema.ticketRow)
    .where(eq(schema.ticketRow.userId, userId));
  return all.find((r) => r.secondaryRefs.some((s) => normalizeRef(s.ref) === norm)) ?? null;
}

export async function getRowView(userId: string, ref: string): Promise<RowView | null> {
  const row = await findRowByRef(userId, ref);
  if (!row) return null;
  const views = await buildViews(userId, [row]);
  return views[0];
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export class EngineError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
  }
}

export type CreateRowInput = {
  identityRef: string;
  origin: "support" | "product";
  subType?: "bug" | "task" | null;
  pipelineKey?: PipelineKey;
  secondaryRefs?: { ref: string; url?: string }[];
  identityUrl?: string;
};

export async function createRow(userId: string, input: CreateRowInput): Promise<RowView> {
  const pipelines = await loadPipelines();
  const subType = input.origin === "support" ? (input.subType ?? "bug") : null;
  const pipelineKey = input.pipelineKey ?? defaultPipeline(input.origin, subType);
  const def = pipelines[pipelineKey];
  if (!def) throw new EngineError(`Unknown pipeline: ${pipelineKey}`);
  if (def.origin !== input.origin) {
    throw new EngineError(`Pipeline ${pipelineKey} does not match origin ${input.origin}`);
  }
  const identityRef = normalizeRef(input.identityRef);
  if (!identityRef) throw new EngineError("identityRef is required");

  const secondaryRefs: ExternalRef[] = (input.secondaryRefs ?? []).map((r) => ({
    kind: refKind(r.ref),
    ref: normalizeRef(r.ref),
    ...(r.url ? { url: r.url } : {}),
  }));

  const rowId = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: schema.ticketRow.id })
      .from(schema.ticketRow)
      .where(
        and(eq(schema.ticketRow.userId, userId), eq(schema.ticketRow.identityRef, identityRef)),
      );
    if (existing.length > 0) {
      throw new EngineError(`A row for ${identityRef} already exists`, 409);
    }
    const [row] = await tx
      .insert(schema.ticketRow)
      .values({
        userId,
        origin: input.origin,
        subType,
        pipelineKey,
        identityRef,
        identityUrl: input.identityUrl ?? null,
        secondaryRefs,
        currentMilestone: def.milestones[0].key,
      })
      .returning({ id: schema.ticketRow.id });
    // Materialize all milestone/sub-task states up front so ticks are pure updates.
    await tx.insert(schema.milestoneState).values(
      def.milestones.map((m) => ({ rowId: row.id, milestoneKey: m.key })),
    );
    await tx.insert(schema.subtaskState).values(
      def.milestones.flatMap((m) =>
        m.subtasks.map((s) => ({ rowId: row.id, milestoneKey: m.key, subtaskKey: s.key })),
      ),
    );
    return row.id;
  });

  const [view] = await buildViews(userId, [
    (await db.select().from(schema.ticketRow).where(eq(schema.ticketRow.id, rowId)))[0],
  ]);
  return view;
}

/** Recompute milestone completion + bar position after a sub-task check. */
async function recomputeAfterCheck(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  row: RowRecord,
  def: PipelineDef,
  milestoneKey: string,
  checked: boolean,
) {
  if (checked) {
    // Milestone completes when all its sub-tasks are checked.
    const states = await tx
      .select()
      .from(schema.subtaskState)
      .where(
        and(
          eq(schema.subtaskState.rowId, row.id),
          eq(schema.subtaskState.milestoneKey, milestoneKey),
        ),
      );
    const mDef = def.milestones.find((m) => m.key === milestoneKey)!;
    const allChecked = mDef.subtasks.every(
      (s) => states.find((st) => st.subtaskKey === s.key)?.checked,
    );
    if (allChecked) {
      await tx
        .update(schema.milestoneState)
        .set({ complete: true, updatedAt: new Date() })
        .where(
          and(
            eq(schema.milestoneState.rowId, row.id),
            eq(schema.milestoneState.milestoneKey, milestoneKey),
            eq(schema.milestoneState.complete, false),
          ),
        );
    }
  }
  // Unchecking never un-completes a milestone (spec §5.4) — loose end instead.

  const milestones = await tx
    .select()
    .from(schema.milestoneState)
    .where(eq(schema.milestoneState.rowId, row.id));
  const byKey = new Map(milestones.map((m) => [m.milestoneKey, m]));
  const firstIncomplete = def.milestones.find((m) => !byKey.get(m.key)?.complete);
  const isComplete = !firstIncomplete;
  await tx
    .update(schema.ticketRow)
    .set({
      currentMilestone: firstIncomplete?.key ?? def.milestones[def.milestones.length - 1].key,
      isComplete,
      updatedAt: new Date(),
    })
    .where(eq(schema.ticketRow.id, row.id));
}

export async function setSubtask(
  userId: string,
  ref: string,
  milestoneKey: string,
  subtaskKey: string,
  checked: boolean,
): Promise<RowView> {
  const row = await findRowByRef(userId, ref);
  if (!row) throw new EngineError(`No row found for ${ref}`, 404);
  const pipelines = await loadPipelines();
  const def = pipelines[row.pipelineKey];
  const mDef = def.milestones.find((m) => m.key === milestoneKey);
  if (!mDef) throw new EngineError(`Unknown milestone ${milestoneKey} for ${row.pipelineKey}`);
  if (!mDef.subtasks.some((s) => s.key === subtaskKey)) {
    throw new EngineError(`Unknown sub-task ${subtaskKey} in milestone ${milestoneKey}`);
  }

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(schema.subtaskState)
      .set({ checked, updatedAt: new Date() })
      .where(
        and(
          eq(schema.subtaskState.rowId, row.id),
          eq(schema.subtaskState.milestoneKey, milestoneKey),
          eq(schema.subtaskState.subtaskKey, subtaskKey),
        ),
      )
      .returning();
    if (updated.length === 0) throw new EngineError("Sub-task state missing", 500);
    await recomputeAfterCheck(tx, row, def, milestoneKey, checked);
  });

  return (await getRowView(userId, row.identityRef))!;
}

/**
 * Regression: uncheck a milestone → it and every milestone after it are fully
 * cleared (sub-tasks and completion), and the bar returns to that milestone.
 */
export async function regressToMilestone(
  userId: string,
  ref: string,
  milestoneKey: string,
): Promise<RowView> {
  const row = await findRowByRef(userId, ref);
  if (!row) throw new EngineError(`No row found for ${ref}`, 404);
  const pipelines = await loadPipelines();
  const def = pipelines[row.pipelineKey];
  const idx = def.milestones.findIndex((m) => m.key === milestoneKey);
  if (idx === -1) throw new EngineError(`Unknown milestone ${milestoneKey}`);
  const clearedKeys = def.milestones.slice(idx).map((m) => m.key);

  await db.transaction(async (tx) => {
    await tx
      .update(schema.subtaskState)
      .set({ checked: false, updatedAt: new Date() })
      .where(
        and(
          eq(schema.subtaskState.rowId, row.id),
          inArray(schema.subtaskState.milestoneKey, clearedKeys),
        ),
      );
    await tx
      .update(schema.milestoneState)
      .set({ complete: false, updatedAt: new Date() })
      .where(
        and(
          eq(schema.milestoneState.rowId, row.id),
          inArray(schema.milestoneState.milestoneKey, clearedKeys),
        ),
      );
    await tx
      .update(schema.ticketRow)
      .set({ currentMilestone: milestoneKey, isComplete: false, updatedAt: new Date() })
      .where(eq(schema.ticketRow.id, row.id));
  });

  return (await getRowView(userId, row.identityRef))!;
}

/** Add or remove a secondary ref (pill). Identity ref is immutable. */
export async function updateSecondaryRefs(
  userId: string,
  ref: string,
  action: "add" | "remove",
  target: { ref: string; url?: string },
): Promise<RowView> {
  const row = await findRowByRef(userId, ref);
  if (!row) throw new EngineError(`No row found for ${ref}`, 404);
  const norm = normalizeRef(target.ref);
  let refs = row.secondaryRefs.filter((r) => normalizeRef(r.ref) !== norm);
  if (action === "add") {
    if (norm === row.identityRef) throw new EngineError("That ref is the row's identity card");
    refs = [...refs, { kind: refKind(norm), ref: norm, ...(target.url ? { url: target.url } : {}) }];
  }
  await db
    .update(schema.ticketRow)
    .set({ secondaryRefs: refs, updatedAt: new Date() })
    .where(eq(schema.ticketRow.id, row.id));
  return (await getRowView(userId, row.identityRef))!;
}

export async function deleteRow(userId: string, ref: string): Promise<void> {
  const row = await findRowByRef(userId, ref);
  if (!row) throw new EngineError(`No row found for ${ref}`, 404);
  await db.delete(schema.ticketRow).where(eq(schema.ticketRow.id, row.id));
}
