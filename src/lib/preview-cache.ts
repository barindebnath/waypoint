import { db, schema } from "./db";
import type { PreviewPayload } from "./db/schema";
import { fetchGithubPrPreview, parseGithubOrg, parsePrRef } from "./github";
import { fetchJiraIssueDetails } from "./jira";

/** The integration settings a preview lookup needs. */
export type PreviewSettings = {
  githubPat: string | null;
  githubDefaultOrg: string | null;
  githubBaseUrl: string | null;
  jiraBaseUrl: string | null;
  jiraEmail: string | null;
  jiraApiToken: string | null;
};

/**
 * Fetch the live preview for one Jira or PR ref. Returns null if the lookup fails.
 * The logic matches the preview endpoint, /api/v1/integrations/preview.
 */
export async function fetchPreviewPayload(
  settings: PreviewSettings,
  ref: string,
): Promise<PreviewPayload | null> {
  if (ref.includes("#")) {
    const defaultOrg =
      settings.githubDefaultOrg || parseGithubOrg(settings.githubBaseUrl || "").org || undefined;
    const parsed = parsePrRef(ref, defaultOrg);
    if (!parsed) return null;
    const pr = await fetchGithubPrPreview(settings.githubPat, parsed.owner, parsed.repo, parsed.pullNumber);
    return pr?.title ? { ref, title: pr.title, pr } : null;
  }

  // Jira needs all three credentials. Without them, skip the call.
  if (!settings.jiraBaseUrl || !settings.jiraEmail || !settings.jiraApiToken) return null;
  const issue = await fetchJiraIssueDetails(
    settings.jiraBaseUrl,
    settings.jiraEmail,
    settings.jiraApiToken,
    ref,
  );
  return issue?.summary ? { ref, title: issue.summary, issueType: issue.issueType ?? null } : null;
}

/**
 * Fetch one ref and save the result. A failed lookup keeps the old cached preview.
 * This function never throws, so one bad ref does not stop the sync.
 */
export async function refreshPreviewCache(
  userId: string,
  settings: PreviewSettings,
  ref: string,
): Promise<void> {
  try {
    const payload = await fetchPreviewPayload(settings, ref);
    if (!payload) return;
    await db
      .insert(schema.previewCache)
      .values({ userId, ref, payload, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [schema.previewCache.userId, schema.previewCache.ref],
        set: { payload, updatedAt: new Date() },
      });
  } catch (err) {
    console.error(`Failed to refresh preview cache for ${ref}:`, err);
  }
}
