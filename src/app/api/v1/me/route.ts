import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";
import { handle, parseBody } from "@/lib/api-helpers";
import { db, schema } from "@/lib/db";

/**
 * Stored integration secrets. GET never returns their values (OWASP A01/A02):
 * the browser only learns whether each one is set. PATCH treats them as
 * write-only — see `secretField` below.
 */
const SECRET_FIELDS = [
  "jiraApiToken",
  "githubPat",
  "tempoApiToken",
  "msClientSecret",
  "msRefreshToken",
] as const;

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return NextResponse.json({
      userId: user.userId,
      via: user.via,
      scopes: user.scopes,
      timezone: user.timezone,
      jiraBaseUrl: user.jiraBaseUrl,
      jiraEmail: user.jiraEmail,
      githubBaseUrl: user.githubBaseUrl,
      githubDefaultOrg: user.githubDefaultOrg,
      colorTheme: user.colorTheme,
      fontTheme: user.fontTheme,
      showTimesheet: user.showTimesheet,
      jiraAccountId: user.jiraAccountId,
      msClientId: user.msClientId,
      autoTempoDefaultRule: user.autoTempoDefaultRule,
      autoTempoSkipDays: user.autoTempoSkipDays,
      autoTempoRules: user.autoTempoRules,
      autoTempoScheduled: user.autoTempoScheduled,
      // Presence flags only — the secret values stay on the server.
      hasJiraApiToken: !!user.jiraApiToken,
      hasGithubPat: !!user.githubPat,
      hasTempoApiToken: !!user.tempoApiToken,
      hasMsClientSecret: !!user.msClientSecret,
      hasMsRefreshToken: !!user.msRefreshToken,
    });
  });
}

/**
 * Write-only secret input:
 * - field absent, or a blank / whitespace-only string → keep the stored value
 *   (the transform maps blank to undefined, and the update skips undefined keys);
 * - non-blank string → replace the stored value with the trimmed string;
 * - explicit `null` → clear the stored value.
 * So an empty form field can never erase a stored token by accident.
 */
const secretField = (max: number) =>
  z
    .string()
    .max(max)
    .transform((s) => s.trim() || undefined)
    .nullable()
    .optional();

const patchSchema = z.object({
  timezone: z
    .string()
    .min(1)
    .max(100)
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, "Unknown IANA timezone")
    .optional(),
  jiraBaseUrl: z.string().url().max(500).nullable().optional(),
  jiraEmail: z.string().email().max(255).nullable().optional(),
  jiraApiToken: secretField(500),
  githubBaseUrl: z.string().url().max(500).nullable().optional(),
  githubPat: secretField(500),
  githubDefaultOrg: z.string().max(100).nullable().optional(),
  // "forest" was the default palette before the lime redesign. An old client can still send it.
  // The server stores it as "lime".
  colorTheme: z
    .enum(["lime", "paper", "nord", "forest", "royal"])
    .transform((v) => (v === "forest" ? "lime" : v))
    .optional(),
  fontTheme: z.enum(["serif", "sans", "mono"]).optional(),
  showTimesheet: z.boolean().optional(),
  tempoApiToken: secretField(500),
  jiraAccountId: z.string().max(255).nullable().optional(),
  msClientId: z.string().max(255).nullable().optional(),
  msClientSecret: secretField(500),
  msRefreshToken: secretField(4000),
  autoTempoDefaultRule: z.record(z.string(), z.unknown()).nullable().optional(),
  autoTempoSkipDays: z.array(z.string()).nullable().optional(),
  autoTempoRules: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  autoTempoScheduled: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  return handle(async () => {
    // Writes need a session or a token with the write scope.
    const user = await requireUser({ write: true });
    const body = await parseBody(req, patchSchema);
    // Drop undefined secret keys explicitly, so "keep the stored value" does
    // not depend on how the ORM treats undefined in `.set()`.
    for (const key of SECRET_FIELDS) {
      if (body[key] === undefined) delete body[key];
    }
    await db
      .update(schema.userSettings)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.userSettings.userId, user.userId));
    return NextResponse.json({ ok: true });
  });
}
