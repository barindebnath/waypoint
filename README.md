# ● Waypoint

A personal status tracker that acts as **external memory** for a developer who
ships more because AI does much of the doing. One row = one unit of work,
identified by its card (`ZT-4821`, `OFF-5678`), moving through a fixed
milestone pipeline with mandatory sub-task checklists — plus a weekly Tempo
attestation strip and an analytics view that tells you whether you sped up.

Your AI updates it through the same API you click through, using a personal
access token and the instructions served at **`/llms.txt`** (canonical copy:
[AGENTS.md](AGENTS.md)). Waypoint stores card *references only* — never card
contents, and there are deliberately no free-text fields.

Domain language: [CONTEXT.md](CONTEXT.md) · Spec: [spec-v2.md](spec-v2.md) ·
Decisions: [docs/adr/](docs/adr/)

## Stack

Next.js (App Router) · PostgreSQL (Neon) + Drizzle · Better Auth (+ API-key
plugin for PATs) · Tailwind · TanStack Query · Zod · Luxon. See
[ADR-0001](docs/adr/0001-nextjs-on-vercel.md).

## Local development

```bash
# Prereqs: Node 20, local PostgreSQL
createdb waypoint_dev
cp .env.example .env         # set DATABASE_URL, generate BETTER_AUTH_SECRET
npm install
npx drizzle-kit migrate
npm run dev                  # http://localhost:3000
```

Pipeline definitions seed themselves into the DB on first use (source:
`src/lib/pipelines.ts`).

## Deploy (Neon + Vercel, ~5 minutes)

1. **Neon** — create a free project (region: Singapore or nearest you), copy
   the **pooled** connection string.
2. **Vercel** — *New Project* → import this GitHub repo. Add environment
   variables:
   | Name | Value |
   | :-- | :-- |
   | `DATABASE_URL` | the Neon pooled connection string |
   | `DATABASE_URL_UNPOOLED` | (optional) Neon's direct connection string — used for migrations; added automatically if you use the Neon↔Vercel integration |
   | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | your Vercel URL, e.g. `https://waypoint-xyz.vercel.app` |
3. **Deploy.** Migrations run automatically during the Vercel build
   (`vercel-build` runs `drizzle-kit migrate` first). Sign up at your URL,
   then in **Settings**: set your timezone, Jira base URL, GitHub org URL,
   and create a `read,write` token for your AI.
4. Point your AI at `https://<your-url>/llms.txt` and give it the token.

After changing the schema later: `npm run db:generate`, commit the new
migration file, push — the next deploy applies it.

## API

Everything the dashboard does is available under `/api/v1` with
`Authorization: Bearer wp_…`. Human-readable reference lives at **`/docs`** on
the deployed app; agent-oriented instructions: [AGENTS.md](AGENTS.md) (served
at `/llms.txt`). The public landing page is at `/`.

## Privacy

Email + password hash + timezone only; no name field, no trackers, no
third-party cookies. Self-serve JSON export and hard account deletion in
Settings. Details: `/privacy`.

## License

[MIT](LICENSE)
