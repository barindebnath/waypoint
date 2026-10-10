import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { handle } from "@/lib/api-helpers";
import { fetchGithubPrPreview, parseGithubOrg, parsePrRef } from "@/lib/github";
import { fetchJiraIssueDetails } from "@/lib/jira";
import { demoIntegrationsEnabled, demoPreview } from "@/lib/demo-integrations";

/**
 * A resolved preview may live in the browser cache for 5 minutes. The header is
 * "private", so no shared cache stores it. A failed lookup (null title) is never
 * cached, so the next request can retry.
 */
function previewJson(body: { ref: string; title: string | null } & Record<string, unknown>) {
  return NextResponse.json(body, {
    headers: body.title ? { "Cache-Control": "private, max-age=300" } : undefined,
  });
}

export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const ref = req.nextUrl.searchParams.get("ref")?.trim();

    if (!ref) {
      return NextResponse.json({ ref: "", title: null });
    }

    // Development only: fake data for the DEMO- refs (see src/lib/demo-integrations.ts).
    if (demoIntegrationsEnabled()) {
      const demo = demoPreview(ref);
      if (demo) return NextResponse.json(demo);
    }

    // requireUser already loaded the settings row, so no second database query is needed.
    const settings = user;

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
        return previewJson({ ref, title: pr?.title || null, pr });
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
      return previewJson({ ref, title: issue?.summary ?? null, issueType: issue?.issueType ?? null });
    }

    return NextResponse.json({ ref, title: null });
  });
}
