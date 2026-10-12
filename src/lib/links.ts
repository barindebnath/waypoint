import type { ExternalRef, PreviewPayload, PrRef } from "./db/schema";
import type { RowView } from "./engine";
import { parseGithubOrg } from "./github";
import { db, schema } from "./db";
import { eq } from "drizzle-orm";

export type LinkSettings = {
  jiraBaseUrl: string | null;
  githubBaseUrl: string | null;
};

export type PrStatusView = {
  state: string;
  mergeableState: string;
  reviewDecision: string;
} | null;

export type JiraStatusView = {
  statusName: string;
  statusCategory: string;
} | null;

/**
 * Resolve a ref to a clickable URL. Priority: explicit URL on the ref →
 * per-user link template → null (chip renders as plain text). Links are
 * always optional and never block anything.
 */
export function resolveRefUrl(
  ref: string,
  kind: ExternalRef["kind"] | "github_pr",
  explicitUrl: string | null | undefined,
  settings: LinkSettings,
): string | null {
  if (explicitUrl) return explicitUrl;
  if (kind === "jira" && settings.jiraBaseUrl) {
    return `${settings.jiraBaseUrl.replace(/\/$/, "")}/browse/${encodeURIComponent(ref)}`;
  }
  if (kind === "github_pr" && settings.githubBaseUrl) {
    const { baseUrl } = parseGithubOrg(settings.githubBaseUrl);
    if (baseUrl) {
      const m = ref.match(/^(?:([^#\s]+)\/)?([^#\s]+)#(\d+)$/);
      if (m) {
        // If ref has explicit owner/repo e.g. owner/repo#123
        if (m[1]) {
          return `https://github.com/${m[1]}/${m[2]}/pull/${m[3]}`;
        }
        return `${baseUrl}/${m[2]}/pull/${m[3]}`;
      }
    }
  }
  return null;
}

export type EnrichedRef = ExternalRef & {
  resolvedUrl: string | null;
};

/** A linked PR, with its link and its cached PR status. */
export type EnrichedPr = PrRef & {
  resolvedUrl: string | null;
  prStatus?: PrStatusView;
};

export type EnrichedRowView = Omit<RowView, "secondaryRefs" | "prRefs"> & {
  identityResolvedUrl: string | null;
  jiraStatus?: JiraStatusView;
  secondaryRefs: EnrichedRef[];
  prRefs: EnrichedPr[];
  /** Cached Jira and PR previews, keyed by ref. Filled by the last sync. */
  previews?: Record<string, PreviewPayload>;
};

export function enrichRowView(view: RowView, settings: LinkSettings): EnrichedRowView {
  const identityKind = view.identityRef.includes("#") ? "github_pr" : "jira";
  return {
    ...view,
    identityResolvedUrl: resolveRefUrl(view.identityRef, identityKind, view.identityUrl, settings),
    secondaryRefs: view.secondaryRefs.map((r) => ({
      ...r,
      resolvedUrl: resolveRefUrl(r.ref, r.kind, r.url, settings),
    })),
    prRefs: view.prRefs.map((p) => ({
      ...p,
      resolvedUrl: resolveRefUrl(p.ref, "github_pr", p.url, settings),
    })),
  };
}

export async function enrichRowsWithCaches(
  userId: string,
  rows: RowView[],
  settings: LinkSettings
): Promise<EnrichedRowView[]> {
  const jiraCaches = await db.query.jiraStatusCache.findMany({
    where: eq(schema.jiraStatusCache.userId, userId),
  });
  const prCaches = await db.query.prStatusCache.findMany({
    where: eq(schema.prStatusCache.userId, userId),
  });
  const previewCaches = await db.query.previewCache.findMany({
    where: eq(schema.previewCache.userId, userId),
  });

  const jiraMap = new Map(jiraCaches.map((c) => [c.cardRef, { statusName: c.statusName, statusCategory: c.statusCategory }]));
  const prMap = new Map(prCaches.map((c) => [c.prRef, { state: c.state, mergeableState: c.mergeableState, reviewDecision: c.reviewDecision }]));
  const previewMap = new Map(previewCaches.map((c) => [c.ref, c.payload]));

  return rows.map((r) => {
    const identityKind = r.identityRef.includes("#") ? "github_pr" : "jira";
    const jiraStatus = jiraMap.get(r.identityRef) ?? null;
    // Only the refs on this row, so the response does not carry the whole cache.
    const refsOfRow = [r.identityRef, ...r.secondaryRefs.map((s) => s.ref), ...r.prRefs.map((p) => p.ref)];
    const previews: Record<string, PreviewPayload> = {};
    for (const ref of refsOfRow) {
      const payload = previewMap.get(ref);
      if (payload) previews[ref] = payload;
    }
    return {
      ...r,
      identityResolvedUrl: resolveRefUrl(r.identityRef, identityKind, r.identityUrl, settings),
      jiraStatus,
      previews,
      secondaryRefs: r.secondaryRefs.map((sec) => ({
        ...sec,
        resolvedUrl: resolveRefUrl(sec.ref, sec.kind, sec.url, settings),
      })),
      prRefs: r.prRefs.map((pr) => ({
        ...pr,
        resolvedUrl: resolveRefUrl(pr.ref, "github_pr", pr.url, settings),
        prStatus: prMap.get(pr.ref) ?? null,
      })),
    };
  });
}
