/**
 * The canonical public origin of the site, without a trailing slash, for absolute URLs
 * in the sitemap and robots.txt.
 *
 * Order:
 * 1. BETTER_AUTH_URL: the canonical browser URL (see README). Auth uses the same value.
 * 2. VERCEL_PROJECT_PRODUCTION_URL: the production domain that Vercel sets.
 * 3. VERCEL_URL: the URL of this deployment (a preview deployment has its own).
 * 4. http://localhost:3000 for local development.
 */
export function siteUrl(): string {
  const explicit = process.env.BETTER_AUTH_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production}`;
  const deployment = process.env.VERCEL_URL?.trim();
  if (deployment) return `https://${deployment}`;
  return "http://localhost:3000";
}
