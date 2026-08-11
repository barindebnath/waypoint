import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { handle, withIdempotency } from "@/lib/api-helpers";
import { completeRow } from "@/lib/engine";
import { enrichRowsWithCaches } from "@/lib/links";

type Params = { params: Promise<{ ref: string }> };

function decodeRef(ref: string): string {
  try {
    return decodeURIComponent(ref);
  } catch {
    return ref;
  }
}

export async function POST(_req: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser({ write: true });
    return withIdempotency(user.userId, async () => {
      const { ref } = await params;
      const row = await completeRow(user.userId, decodeRef(ref));
      const [enriched] = await enrichRowsWithCaches(user.userId, [row], user);
      return NextResponse.json({ row: enriched });
    });
  });
}
