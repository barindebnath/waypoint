import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { handle } from "@/lib/api-helpers";
import { db, schema } from "@/lib/db";
import { fetchGithubPrTitle, parseGithubOrg, parsePrRef } from "@/lib/github";
import { fetchJiraIssueSummary } from "@/lib/jira";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const userId = user.userId;
    const ref = req.nextUrl.searchParams.get("ref")?.trim();

    if (!ref) {
      return NextResponse.json({ ref: "", title: null });
    }

    const settings = await db.query.userSettings.findFirst({
      where: eq(schema.userSettings.userId, userId),
    });

    if (!settings) {
      return NextResponse.json({ ref, title: null });
    }

    // Check if ref is a GitHub PR
    if (ref.includes("#") || ref.toLowerCase().includes("github.com")) {
      const defaultOrg =
        settings.githubDefaultOrg ||
        parseGithubOrg(settings.githubBaseUrl || "").org ||
        undefined;

      const parsed = parsePrRef(ref, defaultOrg);
      if (parsed) {
        const title = await fetchGithubPrTitle(
          settings.githubPat,
          parsed.owner,
          parsed.repo,
          parsed.pullNumber
        );
        return NextResponse.json({ ref, title });
      }
    }

    // Otherwise treat as Jira card
    if (settings.jiraBaseUrl && settings.jiraEmail && settings.jiraApiToken) {
      const title = await fetchJiraIssueSummary(
        settings.jiraBaseUrl,
        settings.jiraEmail,
        settings.jiraApiToken,
        ref
      );
      return NextResponse.json({ ref, title });
    }

    return NextResponse.json({ ref, title: null });
  });
}
