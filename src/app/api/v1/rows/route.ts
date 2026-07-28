import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { handle, parseBody, withIdempotency } from "@/lib/api-helpers";
import { createRow, listRows } from "@/lib/engine";
import { enrichRowsWithCaches } from "@/lib/links";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const rows = await listRows(user.userId);
    const enriched = await enrichRowsWithCaches(user.userId, rows, user);
    return NextResponse.json({ rows: enriched });
  });
}

const createSchema = z.object({
  identityRef: z.string().min(1).max(100),
  origin: z.enum(["support", "product"]),
  subType: z.enum(["bug", "task"]).nullish(),
  pipelineKey: z.enum(["support_full", "support_light", "feature"]).optional(),
  secondaryRefs: z
    .array(z.object({ ref: z.string().min(1).max(100), url: z.string().url().max(500).optional() }))
    .max(20)
    .optional(),
  identityUrl: z.string().url().max(500).optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser({ write: true });
    return withIdempotency(user.userId, async () => {
      const input = await parseBody(req, createSchema);
      const row = await createRow(user.userId, input);
      const [enriched] = await enrichRowsWithCaches(user.userId, [row], user);
      return NextResponse.json({ row: enriched }, { status: 201 });
    });
  });
}
