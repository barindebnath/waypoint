import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { handle, parseBody } from "@/lib/api-helpers";
import { runAutoTempo } from "@/lib/autotempo";

const autoTempoSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser({ write: true });
    const body = await parseBody(req, autoTempoSchema);

    const result = await runAutoTempo(user.userId, body.dates);
    return NextResponse.json(result);
  });
}
