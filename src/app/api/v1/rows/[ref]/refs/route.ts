import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { handle, parseBody, withIdempotency } from "@/lib/api-helpers";
import { updateSecondaryRefs } from "@/lib/engine";
import { enrichRowView } from "@/lib/links";

type Params = { params: Promise<{ ref: string }> };

const bodySchema = z.object({
  action: z.enum(["add", "remove"]),
  ref: z.string().min(1).max(100),
  url: z.string().url().max(500).optional(),
});

export async function POST(req: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser({ write: true });
    return withIdempotency(user.userId, async () => {
      const { ref } = await params;
      const body = await parseBody(req, bodySchema);
      const row = await updateSecondaryRefs(user.userId, decodeURIComponent(ref), body.action, {
        ref: body.ref,
        url: body.url,
      });
      return NextResponse.json({ row: enrichRowView(row, user) });
    });
  });
}
