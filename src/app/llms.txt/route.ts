import { readFile } from "node:fs/promises";
import path from "node:path";

/** Serve AGENTS.md verbatim — the canonical instructions for AIs using Waypoint. */
export async function GET() {
  const content = await readFile(path.join(process.cwd(), "AGENTS.md"), "utf8");
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
