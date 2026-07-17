import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey } from "@better-auth/api-key";
import { db, schema } from "./db";

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
