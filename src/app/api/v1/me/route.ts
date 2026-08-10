import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";
import { handle, parseBody } from "@/lib/api-helpers";
import { db, schema } from "@/lib/db";

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
      jiraApiToken: user.jiraApiToken,
      githubBaseUrl: user.githubBaseUrl,
      githubPat: user.githubPat,
      githubDefaultOrg: user.githubDefaultOrg,
      colorTheme: user.colorTheme,
      fontTheme: user.fontTheme,
      showTimesheet: user.showTimesheet,
      tempoApiToken: user.tempoApiToken,
      jiraAccountId: user.jiraAccountId,
      msClientId: user.msClientId,
      msClientSecret: user.msClientSecret,
      msRefreshToken: user.msRefreshToken,
      autoTempoDefaultRule: user.autoTempoDefaultRule,
      autoTempoSkipDays: user.autoTempoSkipDays,
      autoTempoRules: user.autoTempoRules,
    });
  });
}

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
  jiraApiToken: z.string().max(500).nullable().optional(),
  githubBaseUrl: z.string().url().max(500).nullable().optional(),
  githubPat: z.string().max(500).nullable().optional(),
  githubDefaultOrg: z.string().max(100).nullable().optional(),
  colorTheme: z.enum(["paper", "nord", "forest", "royal"]).optional(),
  fontTheme: z.enum(["serif", "sans", "mono"]).optional(),
  showTimesheet: z.boolean().optional(),
  tempoApiToken: z.string().max(500).nullable().optional(),
  jiraAccountId: z.string().max(255).nullable().optional(),
  msClientId: z.string().max(255).nullable().optional(),
  msClientSecret: z.string().max(500).nullable().optional(),
  msRefreshToken: z.string().max(4000).nullable().optional(),
  autoTempoDefaultRule: z.record(z.string(), z.unknown()).nullable().optional(),
  autoTempoSkipDays: z.array(z.string()).nullable().optional(),
  autoTempoRules: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
});

export async function PATCH(req: Request) {
  return handle(async () => {
    const user = await requireUser({ write: true });
    const body = await parseBody(req, patchSchema);
    await db
      .update(schema.userSettings)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.userSettings.userId, user.userId));
    return NextResponse.json({ ok: true });
  });
}
