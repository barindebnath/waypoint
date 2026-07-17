import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { handle, jsonError } from "@/lib/api-helpers";
import { deleteRow, getRowView } from "@/lib/engine";
import { enrichRowView } from "@/lib/links";

type Params = { params: Promise<{ ref: string }> };

function decodeRef(ref: string): string {
  try {
    return decodeURIComponent(ref);
  } catch {
    return ref;
  }
}

export async function GET(_req: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { ref } = await params;
    const row = await getRowView(user.userId, decodeRef(ref));
    if (!row) return jsonError(`No row found for ${decodeRef(ref)}`, 404);
    return NextResponse.json({ row: enrichRowView(row, user) });
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser({ write: true });
    const { ref } = await params;
    await deleteRow(user.userId, decodeRef(ref));
    return NextResponse.json({ ok: true });
  });
}
