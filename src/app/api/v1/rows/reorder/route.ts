import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { handle, parseBody, withIdempotency } from "@/lib/api-helpers";
import { reorderRows } from "@/lib/engine";

const reorderSchema = z.object({
  rowIds: z.array(z.string().uuid()),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser({ write: true });
    return withIdempotency(user.userId, async () => {
      const input = await parseBody(req, reorderSchema);
      await reorderRows(user.userId, input.rowIds);
      return NextResponse.json({ ok: true });
    });
  });
}
