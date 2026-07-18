import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db, schema } from "./db";

export type AuthedUser = {
  userId: string;
  via: "session" | "token";
  scopes: string[]; // token scopes; sessions always have full access
  timezone: string;
  jiraBaseUrl: string | null;
  githubBaseUrl: string | null;
  colorTheme: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/**
 * Resolve the caller to a user, via either the browser session cookie or a
 * personal access token (`Authorization: Bearer wp_…` or `x-api-key`).
 *
 * Security notes (auth/input handling):
 * - Tokens are verified through Better Auth's apiKey plugin (hashed at rest,
 *   never logged here).
 * - Token scopes come from key metadata; `write: true` requests require the
 *   "write" scope. Session callers get full access (they ARE the user in the
 *   browser, where CSRF is mitigated by SameSite cookies).
 * - Every downstream query must filter by the returned userId — broken access
 *   control is the primary risk in a multi-tenant tracker.
 */
export async function requireUser(opts: { write?: boolean } = {}): Promise<AuthedUser> {
  const hdrs = await headers();
  const bearer = hdrs.get("authorization");
  const apiKeyHeader = hdrs.get("x-api-key") ?? extractBearer(bearer);

  let userId: string;
  let via: "session" | "token";
  let scopes: string[];

  if (apiKeyHeader) {
    const result = await auth.api.verifyApiKey({ body: { key: apiKeyHeader } });
    if (!result.valid || !result.key) {
      throw new ApiError("Invalid or revoked token", 401);
    }
    userId = result.key.referenceId;
    via = "token";
    scopes = parseScopes(result.key.metadata);
    if (opts.write && !scopes.includes("write")) {
      throw new ApiError("This token does not have the write scope", 403);
    }
  } else {
    const session = await auth.api.getSession({ headers: hdrs });
    if (!session) throw new ApiError("Not authenticated", 401);
    userId = session.user.id;
    via = "session";
    scopes = ["read", "write"];
  }

  const settings = await getOrCreateSettings(userId);
  return {
    userId,
    via,
    scopes,
    timezone: settings.timezone,
    jiraBaseUrl: settings.jiraBaseUrl,
    githubBaseUrl: settings.githubBaseUrl,
    colorTheme: settings.colorTheme,
  };
}

function extractBearer(header: string | null): string | null {
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function parseScopes(metadata: unknown): string[] {
  try {
    const obj = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    if (obj && Array.isArray((obj as { scopes?: unknown }).scopes)) {
      return ((obj as { scopes: unknown[] }).scopes).filter((s): s is string => typeof s === "string");
    }
  } catch {
    // fall through — malformed metadata means no scopes
  }
  return ["read"];
}

export async function getOrCreateSettings(userId: string) {
  const existing = await db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, userId));
  if (existing.length > 0) return existing[0];
  const [created] = await db
    .insert(schema.userSettings)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  return (
    await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId))
  )[0];
}
