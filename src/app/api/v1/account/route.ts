import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireUser, ApiError } from "@/lib/api-auth";
import { handle, parseBody } from "@/lib/api-helpers";
import { db, schema } from "@/lib/db";

const confirmSchema = z.object({ confirm: z.literal("DELETE") });

/**
 * Hard-delete the account and every row it owns (privacy: self-serve erasure).
 * Session-only — a leaked PAT must never be able to destroy the account.
 * All app tables cascade from user.id.
 */
export async function DELETE(req: Request) {
  return handle(async () => {
    const user = await requireUser({ write: true });
    if (user.via !== "session") {
      throw new ApiError("Account deletion requires a browser session", 403);
    }
    await parseBody(req, confirmSchema);
    await db.delete(schema.user).where(eq(schema.user.id, user.userId));
    return NextResponse.json({ ok: true, deleted: true });
  });
}
