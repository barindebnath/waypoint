import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { handle, parseBody, withIdempotency } from "@/lib/api-helpers";
import { bulkSetSubtasks, setSubtask } from "@/lib/engine";
import { enrichRowView } from "@/lib/links";

type Params = { params: Promise<{ ref: string }> };

const bodySchema = z.object({
  milestone: z.string().min(1).max(100),
  subtask: z.string().min(1).max(100).optional(), // omit to check all subtasks in the milestone
  checked: z.boolean(),
});

export async function POST(req: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser({ write: true });
    return withIdempotency(user.userId, async () => {
      const { ref } = await params;
      const body = await parseBody(req, bodySchema);
      const row = body.subtask
        ? await setSubtask(
            user.userId,
            decodeURIComponent(ref),
            body.milestone,
            body.subtask,
            body.checked,
          )
        : await bulkSetSubtasks(
            user.userId,
            decodeURIComponent(ref),
            body.milestone,
            body.checked,
          );
      return NextResponse.json({ row: enrichRowView(row, user) });
    });
  });
}
