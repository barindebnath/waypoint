import { drizzle as drizzlePostgresJs, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import postgres from "postgres";
import ws from "ws";
import * as schema from "./schema";

/**
 * Two drivers, one `db` object.
 *
 * - A Neon database host (`*.neon.tech`) uses the Neon serverless driver with a
 *   WebSocket pool. It supports transactions, and it avoids a TCP and TLS
 *   handshake in each serverless function. The app needs transactions, so the
 *   Neon HTTP driver is not an option.
 * - Any other host (local Postgres in development) uses postgres-js. A local
 *   Postgres server does not speak the Neon WebSocket protocol.
 *
 * Both drivers give the same query API, so the rest of the code does not change.
 * Use the pooled connection string here. Migrations use DATABASE_URL_UNPOOLED
 * (see drizzle.config.ts).
 *
 * Set DB_POOL_MAX to change the pool size. The default is 5 in production.
 */
const connectionString = process.env.DATABASE_URL!;
const poolMax = Number(process.env.DB_POOL_MAX) || (process.env.NODE_ENV === "production" ? 5 : 10);

function isNeonHost(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".neon.tech");
  } catch {
    return false;
  }
}

type AppDb = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { appDb?: AppDb };

function createDb(): AppDb {
  if (isNeonHost(connectionString)) {
    // Node 20 has no global WebSocket, so give the driver the `ws` package.
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({
      connectionString,
      max: poolMax,
      idleTimeoutMillis: 20_000, // close idle connections so a frozen instance does not hold them
      connectionTimeoutMillis: 10_000, // fail fast instead of waiting for a dead connection
    });
    // The Neon driver has its own types. The query API matches postgres-js.
    return drizzleNeon(pool, { schema }) as unknown as AppDb;
  }
  const client = postgres(connectionString, {
    max: poolMax,
    idle_timeout: 20, // seconds
    connect_timeout: 10, // seconds
    prepare: false, // required for transaction-mode poolers (pgbouncer)
  });
  return drizzlePostgresJs(client, { schema });
}

// Reuse the db across HMR reloads in development.
export const db = globalForDb.appDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.appDb = db;
export { schema };
