import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";
import { handle } from "@/lib/api-helpers";
import { db, schema } from "@/lib/db";
import { listRows } from "@/lib/engine";

/** Full JSON export of the user's own data (privacy: self-serve portability). */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const [rows, weeks, settings] = await Promise.all([
      listRows(user.userId),
      db
        .select()
        .from(schema.timesheetWeek)
        .where(eq(schema.timesheetWeek.userId, user.userId)),
      db
        .select({
          timezone: schema.userSettings.timezone,
          jiraBaseUrl: schema.userSettings.jiraBaseUrl,
          githubBaseUrl: schema.userSettings.githubBaseUrl,
        })
        .from(schema.userSettings)
        .where(eq(schema.userSettings.userId, user.userId)),
    ]);
    return NextResponse.json(
      {
        exportedAt: new Date().toISOString(),
        settings: settings[0] ?? null,
        ticketRows: rows,
        timesheetWeeks: weeks.map((w) => ({
          weekId: w.weekId,
          days: w.days,
          submit: w.submit,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        })),
      },
      {
        headers: {
          "Content-Disposition": `attachment; filename="waypoint-export.json"`,
        },
      },
    );
  });
}
