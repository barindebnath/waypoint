# Waypoint — repo development notes

**Heads-up: `AGENTS.md` in this repo is NOT developer guidance** — it is the
canonical instruction file for AI agents that *use* the deployed Waypoint API,
and it is served verbatim at `/llms.txt`. Keep it accurate when the API
changes; don't put repo-dev notes in it.

Domain language lives in `CONTEXT.md`; decisions in `docs/adr/` and the
decisions log of `spec-v2.md`. The progress engine (`src/lib/engine.ts`) is
the ONE place milestone/sub-task logic lives — dashboard and API both go
through it.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation
notices.
<!-- END:nextjs-agent-rules -->

## Local dev

- Node 20 via asdf (`.tool-versions`), local Postgres database `waypoint_dev`.
- `npm run dev` — app on http://localhost:3000; `.env` holds `DATABASE_URL`,
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
- Migrations: `npx drizzle-kit generate` after schema edits, `npx drizzle-kit
  migrate` to apply. Pipeline definitions seed lazily from
  `src/lib/pipelines.ts` on first read.
