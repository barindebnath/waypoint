import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { ZodError, type ZodType } from "zod";
import { db, schema } from "./db";
import { ApiError } from "./api-auth";
import { EngineError } from "./engine";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Wrap a route handler: uniform error mapping, never leaking internals. */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError || err instanceof EngineError) {
      return jsonError(err.message, err.status);
    }
    if (err instanceof ZodError) {
      return jsonError(
        err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
        400,
      );
    }
    console.error("API error:", err);
    return jsonError("Internal error", 500);
  }
}

/** Parse and validate a JSON body against a zod schema (strict input validation). */
export async function parseBody<T>(req: Request, zodSchema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError("Request body must be JSON", 400);
  }
  return zodSchema.parse(raw);
}

/**
 * Idempotency (spec §10): if the request carries an `Idempotency-Key` header
 * and we've seen (user, key) before, replay the stored response instead of
 * re-applying the write.
 */
export async function withIdempotency(
  userId: string,
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const hdrs = await headers();
  const key = hdrs.get("idempotency-key");
  if (!key) return fn();
  if (key.length > 200) throw new ApiError("Idempotency-Key too long", 400);

  const existing = await db
    .select()
    .from(schema.idempotencyKey)
    .where(and(eq(schema.idempotencyKey.userId, userId), eq(schema.idempotencyKey.key, key)));
  if (existing.length > 0) {
    return NextResponse.json(existing[0].response, {
      status: existing[0].status,
      headers: { "Idempotency-Replayed": "true" },
    });
  }

  const res = await fn();
  // Only successful writes are worth replay-protection; errors may be retried.
  if (res.status >= 200 && res.status < 300) {
    const body = await res.clone().json();
    await db
      .insert(schema.idempotencyKey)
      .values({ userId, key, response: body, status: res.status })
      .onConflictDoNothing();
  }
  return res;
}
