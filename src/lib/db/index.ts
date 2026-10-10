import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

// Reuse the client across HMR reloads in dev.
// A page load sends many API calls at once, and one server instance handles them together.
// A pool of 1 made every query wait in one line, so the production default is 5.
// The pool talks to a pooled Neon connection string, so a small pool per instance is safe.
// Set DB_POOL_MAX to change the size.
const poolMax = Number(process.env.DB_POOL_MAX) || (process.env.NODE_ENV === "production" ? 5 : 10);

const client =
  globalForDb.pgClient ??
  postgres(process.env.DATABASE_URL!, {
    max: poolMax,
    idle_timeout: 20, // seconds; close idle connections so a frozen instance does not hold them
    connect_timeout: 10, // seconds; fail fast instead of waiting for a dead connection
    prepare: false, // required for transaction-mode poolers (Neon/pgbouncer)
  });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export { schema };
