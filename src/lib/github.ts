export interface ParsedPrRef {
  owner: string;
  repo: string;
  pullNumber: number;
  fullRef: string;
}

export function parseGithubOrg(input: string | null | undefined): { org: string | null; baseUrl: string | null } {
  if (!input || !input.trim()) return { org: null, baseUrl: null };
  const trimmed = input.trim().replace(/\/+$/, "");
  // Ignore bare github.com
  if (/^(?:https?:\/\/)?(?:www\.)?github\.com$/i.test(trimmed)) {
    return { org: null, baseUrl: "https://github.com" };
  }
  const urlMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)$/i);
  if (urlMatch) {
    const org = urlMatch[1];
    return { org, baseUrl: `https://github.com/${org}` };
  }
  if (!trimmed.includes("://") && !trimmed.includes(".")) {
    return { org: trimmed, baseUrl: `https://github.com/${trimmed}` };
  }
  return { org: null, baseUrl: null };
}

export function parsePrRef(ref: string, defaultOrg?: string): ParsedPrRef | null {
  const trimmed = ref.trim();
  // Match full GitHub PR URL: https://github.com/owner/repo/pull/123
  const urlMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/pull\/(\d+)/i);
  if (urlMatch) {
    const owner = urlMatch[1];
    const repo = urlMatch[2];
    const pullNumber = parseInt(urlMatch[3], 10);
    return { owner, repo, pullNumber, fullRef: `${owner}/${repo}#${pullNumber}` };
  }

  const match = trimmed.match(/^(?:([a-zA-Z0-9_.-]+)\/)?([a-zA-Z0-9_.-]+)#(\d+)$/);
  if (!match) return null;
  const owner = match[1] || defaultOrg;
  if (!owner) return null;
  const repo = match[2];
  const pullNumber = parseInt(match[3], 10);
  return { owner, repo, pullNumber, fullRef: `${owner}/${repo}#${pullNumber}` };
}

export interface GithubPrDetails {
  state: "open" | "closed" | "merged" | "draft";
  mergeableState: "clean" | "dirty" | "blocked" | "unknown";
  reviewDecision: "approved" | "changes_requested" | "review_required" | "none";
}

export type FetchPrResult =
  | { success: true; details: GithubPrDetails }
  | { success: false; error: string };

export async function fetchGithubPrStatus(
  pat: string | null | undefined,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<FetchPrResult> {
  try {
    const token = pat?.trim() || "";
    const authHeadersToTry: (string | null)[] = token
      ? token.startsWith("github_pat_")
        ? [`Bearer ${token}`, `token ${token}`]
        : [`token ${token}`, `Bearer ${token}`]
      : [null];

    let lastRes: Response | null = null;

    for (const authHeader of authHeadersToTry) {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Waypoint-App",
      };
      if (authHeader) headers.Authorization = authHeader;

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, {
        headers,
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        let state: GithubPrDetails["state"] = "open";
        if (data.merged) state = "merged";
        else if (data.state === "closed") state = "closed";
        else if (data.draft) state = "draft";

        const mergeableState =
          data.mergeable_state === "dirty" ? "dirty" : data.mergeable ? "clean" : "unknown";

        let reviewDecision: GithubPrDetails["reviewDecision"] = "none";
        const reviewsRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
          { headers, signal: AbortSignal.timeout(5000) }
        );
        if (reviewsRes.ok) {
          const reviews = await reviewsRes.json();
          const states = reviews.map((r: { state: string }) => r.state);
          if (states.includes("CHANGES_REQUESTED")) reviewDecision = "changes_requested";
          else if (states.includes("APPROVED")) reviewDecision = "approved";
        }

        return { success: true, details: { state, mergeableState, reviewDecision } };
      }
      lastRes = res;
    }

    const status = lastRes?.status ?? 404;
    if (status === 404) {
      return {
        success: false,
        error: `GitHub 404 Not Found for ${owner}/${repo}#${pullNumber}. Check repository name, and ensure your GitHub PAT in Settings has 'repo' or 'Pull Requests: Read' access to ${owner}/${repo}.`,
      };
    }
    if (status === 401) {
      return {
        success: false,
        error: `GitHub 401 Unauthorized for ${owner}/${repo}#${pullNumber}. Personal Access Token is invalid or expired.`,
      };
    }
    if (status === 403) {
      return {
        success: false,
        error: `GitHub 403 Forbidden for ${owner}/${repo}#${pullNumber}. Rate limit exceeded or PAT missing repo scope.`,
      };
    }
    return {
      success: false,
      error: `GitHub API error ${status}: ${lastRes?.statusText ?? "Unknown error"}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `GitHub network request failed: ${err.message ?? err}`,
    };
  }
}
