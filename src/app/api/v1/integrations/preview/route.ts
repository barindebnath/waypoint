import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { handle } from "@/lib/api-helpers";
import { db, schema } from "@/lib/db";
import { fetchGithubPrPreview, parseGithubOrg, parsePrRef } from "@/lib/github";
import { fetchJiraIssueDetails } from "@/lib/jira";
import { demoIntegrationsEnabled, demoPreview } from "@/lib/demo-integrations";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const userId = user.userId;
    const ref = req.nextUrl.searchParams.get("ref")?.trim();

    if (!ref) {
      return NextResponse.json({ ref: "", title: null });
    }

    // Development only: fake data for the DEMO- refs (see src/lib/demo-integrations.ts).
    if (demoIntegrationsEnabled()) {
      const demo = demoPreview(ref);
      if (demo) return NextResponse.json(demo);
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
        const pr = await fetchGithubPrPreview(
          settings.githubPat,
          parsed.owner,
          parsed.repo,
          parsed.pullNumber
        );
        return NextResponse.json({ ref, title: pr?.title || null, pr });
      }
    }

    // Otherwise treat as Jira card
    if (settings.jiraBaseUrl && settings.jiraEmail && settings.jiraApiToken) {
      const issue = await fetchJiraIssueDetails(
        settings.jiraBaseUrl,
        settings.jiraEmail,
        settings.jiraApiToken,
        ref
      );
      return NextResponse.json({ ref, title: issue?.summary ?? null, issueType: issue?.issueType ?? null });
    }

    return NextResponse.json({ ref, title: null });
  });
}
