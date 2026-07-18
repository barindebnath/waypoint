import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey } from "@better-auth/api-key";
import { db, schema } from "./db";

/**
 * Vercel sets VERCEL_URL for every deployment, but Better Auth deliberately
 * does not consume that server-only variable. Use it as a safe fallback when
 * an explicit canonical URL has not been configured yet. A custom domain must
 * still be supplied through BETTER_AUTH_URL so callback/origin validation is
 * anchored to the URL that users actually visit.
 */
function vercelDeploymentUrl() {
  const host = process.env.VERCEL_URL;
  return host ? `https://${host}` : undefined;
}

const baseURL = process.env.BETTER_AUTH_URL?.trim() || vercelDeploymentUrl();
const deploymentURL = vercelDeploymentUrl();

/**
 * Better Auth server instance.
 *
 * - Email + password only; `name` is derived from the email prefix at signup
 *   (data minimization — never collected as its own field).
 * - Session cookies are HttpOnly + SameSite (Secure in production) with CSRF
 *   protection, all handled by Better Auth.
 * - The apiKey plugin provides personal access tokens: hashed at rest, shown
 *   once, revocable. Keys authenticate requests via the `x-api-key` header
 *   (our API also accepts `Authorization: Bearer` and maps it across).
 */
export const auth = betterAuth({
  // Pin the canonical public origin in production rather than relying on the
  // internal serverless request URL. VERCEL_URL also keeps direct deployment
  // URLs working while a custom domain is configured as BETTER_AUTH_URL.
  baseURL,
  trustedOrigins: deploymentURL ? [deploymentURL] : undefined,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      apikey: schema.apikey,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
  },
  plugins: [
    apiKey({
      // PAT scopes live in metadata ({ scopes: ["read","write"] }) and are
      // enforced in src/lib/api-auth.ts on every API request.
      enableMetadata: true,
      defaultPrefix: "wp_",
      // Default is 10 req/day — useless for an AI mirroring work. Keep abuse
      // protection but at a rate a busy agent won't hit: 240 req/min.
      rateLimit: {
        enabled: true,
        timeWindow: 60 * 1000,
        maxRequests: 240,
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
