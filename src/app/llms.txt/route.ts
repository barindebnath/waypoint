import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { handle } from "@/lib/api-helpers";

/** Serve AGENTS.md verbatim — the canonical instructions for AIs using Waypoint. */
export async function GET() {
  // The instructions describe an authenticated user's workspace and should be
  // available only to that user in the browser or to an agent using their PAT.
  return handle(async () => {
    await requireUser();
    const content = await readFile(path.join(process.cwd(), "AGENTS.md"), "utf8");
    return new NextResponse(content, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  });
}
