import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { handle } from "@/lib/api-helpers";
import { loadPipelines } from "@/lib/engine";

/** The pipeline definitions (milestones + sub-tasks), for UIs and AIs alike. */
export async function GET() {
  return handle(async () => {
    await requireUser();
    const pipelines = await loadPipelines();
    return NextResponse.json({ pipelines });
  });
}
