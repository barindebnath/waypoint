/**
 * Seed demo rows that look like rows with Jira and GitHub connected.
 *
 * Usage (local database only):
 *   npx tsx --env-file=.env scripts/seed-demo.ts <email>            # add or reset the demo rows
 *   npx tsx --env-file=.env scripts/seed-demo.ts <email> --remove   # remove the demo rows
 *
 * To see the titles, the issue types and the PR details, start the dev server with
 * WAYPOINT_DEMO_INTEGRATIONS=1. See src/lib/demo-integrations.ts.
 *
 * The script changes only rows whose identity ref starts with DEMO-, and their cache entries.
 */
import { and, eq, inArray, like, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { completeRow, createRow, deleteRow, setSubtask, type CreateRowInput } from "@/lib/engine";
import { DEMO_JIRA, DEMO_PRS } from "@/lib/demo-integrations";

type DemoRow = CreateRowInput & {
  /** Tick this sub-task. The engine also ticks every earlier sub-task, so this sets the column. */
  tick?: { milestone: string; subtask: string };
  complete?: boolean;
  /** Hours since the row came into its current milestone. */
  stageHours: number;
  /** Hours since the row was created. */
  ageHours: number;
};

const ROWS: DemoRow[] = [
  { identityRef: "DEMO-13702", origin: "product", tick: { milestone: "definition", subtask: "estimates_added" }, stageHours: 20, ageHours: 20 },
  { identityRef: "DEMO-13698", origin: "product", secondaryRefs: [{ ref: "demo-hub2-api#574" }], tick: { milestone: "development", subtask: "pr_raised" }, stageHours: 50, ageHours: 140 },
  { identityRef: "DEMO-2041", origin: "support", subType: "bug", secondaryRefs: [{ ref: "demo-billing#88" }], tick: { milestone: "development", subtask: "code_committed" }, stageHours: 98, ageHours: 160 },
  { identityRef: "DEMO-2063", origin: "support", subType: "task", tick: { milestone: "resolution", subtask: "run_against_db" }, stageHours: 6, ageHours: 30 },
  { identityRef: "DEMO-13655", origin: "product", secondaryRefs: [{ ref: "demo-hooks#212" }], tick: { milestone: "staging", subtask: "deployed_staging" }, stageHours: 75, ageHours: 260 },
  { identityRef: "DEMO-2057", origin: "support", subType: "bug", secondaryRefs: [{ ref: "demo-auth#301" }], tick: { milestone: "staging", subtask: "card_ready_for_qa" }, stageHours: 26, ageHours: 120 },
  { identityRef: "DEMO-13610", origin: "product", secondaryRefs: [{ ref: "demo-admin-ui#940" }], tick: { milestone: "prod_close", subtask: "merged_main" }, stageHours: 122, ageHours: 400 },
  { identityRef: "DEMO-2012", origin: "support", subType: "bug", secondaryRefs: [{ ref: "demo-notify#57" }], complete: true, stageHours: 30, ageHours: 300 },
];

/** Refuse to run against anything but a local database, so the script cannot write demo data to production. */
function assertLocalDatabase() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed: NODE_ENV is production.");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Run with --env-file=.env.");
  const host = new URL(url).hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
    throw new Error(`Refusing to seed: the database host is "${host}", not a local host.`);
  }
}

async function removeDemoRows(userId: string) {
  const rows = await db.query.ticketRow.findMany({
    where: and(eq(schema.ticketRow.userId, userId), like(schema.ticketRow.identityRef, "DEMO-%")),
  });
  for (const r of rows) await deleteRow(userId, r.identityRef);
  await db.delete(schema.jiraStatusCache).where(
    and(eq(schema.jiraStatusCache.userId, userId), inArray(schema.jiraStatusCache.cardRef, Object.keys(DEMO_JIRA))),
  );
  await db.delete(schema.prStatusCache).where(
    and(eq(schema.prStatusCache.userId, userId), inArray(schema.prStatusCache.prRef, Object.keys(DEMO_PRS))),
  );
  return rows.length;
}

async function main() {
  assertLocalDatabase();
  const [email, flag] = process.argv.slice(2);
  if (!email) throw new Error("Usage: scripts/seed-demo.ts <email> [--remove]");

  const user = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
  if (!user) throw new Error(`No user with the email ${email}. Sign up in the local app first.`);

  const removed = await removeDemoRows(user.id);
  if (flag === "--remove") {
    console.log(`Removed ${removed} demo rows.`);
    return;
  }

  for (const r of ROWS) {
    const { tick, complete, stageHours, ageHours, ...input } = r;
    await createRow(user.id, input);
    if (tick) await setSubtask(user.id, r.identityRef, tick.milestone, tick.subtask, true);
    if (complete) await completeRow(user.id, r.identityRef);

    // Move the timestamps back, so the cards show a realistic age and time in stage.
    const row = await db.query.ticketRow.findFirst({
      where: and(eq(schema.ticketRow.userId, user.id), eq(schema.ticketRow.identityRef, r.identityRef)),
    });
    if (!row) continue;
    const stageAt = sql`now() - make_interval(hours => ${stageHours})`;
    await db.update(schema.ticketRow)
      .set({ createdAt: sql`now() - make_interval(hours => ${ageHours})` })
      .where(eq(schema.ticketRow.id, row.id));
    await db.update(schema.milestoneState).set({ createdAt: stageAt, updatedAt: stageAt }).where(eq(schema.milestoneState.rowId, row.id));
    await db.update(schema.subtaskState).set({ updatedAt: stageAt }).where(eq(schema.subtaskState.rowId, row.id));
  }

  // The Jira and PR statuses come from the cache tables, which the sync endpoint normally fills.
  for (const [cardRef, j] of Object.entries(DEMO_JIRA)) {
    await db.insert(schema.jiraStatusCache)
      .values({ cardRef, userId: user.id, statusName: j.statusName, statusCategory: j.statusCategory })
      .onConflictDoUpdate({
        target: schema.jiraStatusCache.cardRef,
        set: { userId: user.id, statusName: j.statusName, statusCategory: j.statusCategory, updatedAt: new Date() },
      });
  }
  for (const [prRef, p] of Object.entries(DEMO_PRS)) {
    await db.insert(schema.prStatusCache)
      .values({ prRef, userId: user.id, state: p.state, mergeableState: p.mergeableState, reviewDecision: p.reviewDecision })
      .onConflictDoUpdate({
        target: schema.prStatusCache.prRef,
        set: { userId: user.id, state: p.state, mergeableState: p.mergeableState, reviewDecision: p.reviewDecision, updatedAt: new Date() },
      });
  }

  console.log(`Seeded ${ROWS.length} demo rows for ${email}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
