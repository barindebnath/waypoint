import type { ExternalRef } from "./db/schema";
import type { RowView } from "./engine";

export type LinkSettings = {
  jiraBaseUrl: string | null;
  githubBaseUrl: string | null;
};

/**
 * Resolve a ref to a clickable URL. Priority: explicit URL on the ref →
 * per-user link template → null (chip renders as plain text). Links are
 * always optional and never block anything.
 */
export function resolveRefUrl(
  ref: string,
  kind: ExternalRef["kind"],
  explicitUrl: string | null | undefined,
  settings: LinkSettings,
): string | null {
  if (explicitUrl) return explicitUrl;
  if (kind === "jira" && settings.jiraBaseUrl) {
    return `${settings.jiraBaseUrl.replace(/\/$/, "")}/browse/${encodeURIComponent(ref)}`;
  }
  if (kind === "github_pr" && settings.githubBaseUrl) {
    const m = ref.match(/^([^#\s]+)#(\d+)$/);
    if (m) {
      return `${settings.githubBaseUrl.replace(/\/$/, "")}/${m[1]}/pull/${m[2]}`;
    }
  }
  return null;
}

export type EnrichedRef = ExternalRef & { resolvedUrl: string | null };
export type EnrichedRowView = Omit<RowView, "secondaryRefs"> & {
  identityResolvedUrl: string | null;
  secondaryRefs: EnrichedRef[];
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
  };
}
