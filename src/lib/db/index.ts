import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

// Reuse the client across HMR reloads in dev; serverless-friendly low connection count in prod.
const client =
  globalForDb.pgClient ??
  postgres(process.env.DATABASE_URL!, {
    max: process.env.NODE_ENV === "production" ? 1 : 10,
    prepare: false, // required for transaction-mode poolers (Neon/pgbouncer)
  });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export { schema };
