import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { handle, parseBody, withIdempotency } from "@/lib/api-helpers";
import { regressToMilestone } from "@/lib/engine";
import { enrichRowView } from "@/lib/links";

type Params = { params: Promise<{ ref: string }> };

const bodySchema = z.object({ milestone: z.string().min(1).max(100) });

export async function POST(req: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser({ write: true });
    return withIdempotency(user.userId, async () => {
      const { ref } = await params;
      const body = await parseBody(req, bodySchema);
      const row = await regressToMilestone(user.userId, decodeURIComponent(ref), body.milestone);
      return NextResponse.json({ row: enrichRowView(row, user) });
    });
  });
}
