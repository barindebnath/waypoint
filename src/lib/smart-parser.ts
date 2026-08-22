import { parsePrRef } from "./github";

export interface ParsedCardInput {
  raw: string;
  identityRef: string;
  origin: "support" | "product";
  subType: "bug" | "task";
  linkedPrRef?: string;
  detectedType: "jira" | "github_pr" | "mixed" | "plain_ref" | "unknown";
  confidenceLabel?: string;
}

const SUPPORT_PREFIXES = ["ZT", "SUP", "SUPPORT", "INC", "HELP", "BUG", "HOTFIX", "OPS"];
const PRODUCT_PREFIXES = ["OFF", "PES", "EN", "FEAT", "PROD", "CORE", "APP", "WEB", "API", "DEV"];

export function inferOriginAndSubType(
  ref: string,
  rawContext = ""
): { origin: "support" | "product"; subType: "bug" | "task" } {
  const upperRef = ref.toUpperCase().trim();
  const lowerContext = rawContext.toLowerCase();

  // Extract prefix before hyphen e.g. "ZT-123" -> "ZT"
  const prefixMatch = upperRef.match(/^([A-Z0-9]+)-/);
  const prefix = prefixMatch ? prefixMatch[1] : "";

  const isSupport =
    SUPPORT_PREFIXES.includes(prefix) ||
    lowerContext.includes("support") ||
    lowerContext.includes("incident") ||
    upperRef.startsWith("ZT-");

  const isTaskKeyword =
    lowerContext.includes("task") ||
    lowerContext.includes("query") ||
    lowerContext.includes("sql") ||
    lowerContext.includes("data-fix") ||
    lowerContext.includes("script") ||
    lowerContext.includes("manual-fix");

  if (isSupport) {
    return {
      origin: "support",
      subType: isTaskKeyword ? "task" : "bug",
    };
  }

  if (PRODUCT_PREFIXES.includes(prefix)) {
    return {
      origin: "product",
      subType: "bug",
    };
  }

  return {
    origin: "product",
    subType: "bug",
  };
}

export function parseSmartCardInput(input: string, defaultOrg?: string): ParsedCardInput {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      raw: input,
      identityRef: "",
      origin: "product",
      subType: "bug",
      detectedType: "unknown",
    };
  }

  // Check for Jira URL: https://*/browse/ABC-123 or https://*/issues/ABC-123
  const jiraUrlMatch = trimmed.match(/(?:https?:\/\/[^\s\/]+(?:\/[^\s\/]+)*\/browse\/|issues\/)([A-Za-z0-9]+-\d+)/i);
  // Check for GitHub PR URL in the input
  const githubUrlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/pull\/(\d+)/i);

  let identityRef = "";
  let linkedPrRef: string | undefined = undefined;
  let detectedType: ParsedCardInput["detectedType"] = "unknown";
  let confidenceLabel: string | undefined = undefined;

  if (jiraUrlMatch && githubUrlMatch) {
    identityRef = jiraUrlMatch[1].toUpperCase();
    const owner = githubUrlMatch[1];
    const repo = githubUrlMatch[2];
    const num = githubUrlMatch[3];
    linkedPrRef = `${owner}/${repo}#${num}`;
    detectedType = "mixed";
    confidenceLabel = `Jira ${identityRef} + PR ${linkedPrRef}`;
  } else if (jiraUrlMatch) {
    identityRef = jiraUrlMatch[1].toUpperCase();
    detectedType = "jira";
    confidenceLabel = `Jira link (${identityRef})`;
  } else if (githubUrlMatch) {
    const owner = githubUrlMatch[1];
    const repo = githubUrlMatch[2];
    const num = githubUrlMatch[3];
    const prRef = `${owner}/${repo}#${num}`;
    identityRef = prRef;
    linkedPrRef = prRef;
    detectedType = "github_pr";
    confidenceLabel = `GitHub PR (${prRef})`;
  } else {
    // Check tokens for Jira ticket pattern ABC-123 or PR repo#123
    const tokens = trimmed.split(/\s+/);
    const jiraToken = tokens.find((t) => /^[A-Za-z0-9]+-\d+$/i.test(t));
    const prToken = tokens.find((t) => parsePrRef(t, defaultOrg) !== null);

    if (jiraToken && prToken && jiraToken !== prToken) {
      identityRef = jiraToken.toUpperCase();
      const parsedPr = parsePrRef(prToken, defaultOrg);
      if (parsedPr) linkedPrRef = parsedPr.fullRef;
      detectedType = "mixed";
      confidenceLabel = `Card ${identityRef} + PR ${linkedPrRef || prToken}`;
    } else if (jiraToken) {
      identityRef = jiraToken.toUpperCase();
      detectedType = "plain_ref";
      confidenceLabel = `Card ref ${identityRef}`;
    } else if (prToken) {
      const parsedPr = parsePrRef(prToken, defaultOrg);
      identityRef = parsedPr ? parsedPr.fullRef : prToken;
      linkedPrRef = identityRef;
      detectedType = "github_pr";
      confidenceLabel = `GitHub PR ${identityRef}`;
    } else {
      // Fallback: take the first non-empty word and clean it up
      identityRef = tokens[0].replace(/[^A-Za-z0-9_-]/g, "").toUpperCase();
      detectedType = "plain_ref";
    }
  }

  const { origin, subType } = inferOriginAndSubType(identityRef, trimmed);

  return {
    raw: input,
    identityRef,
    origin,
    subType,
    linkedPrRef,
    detectedType,
    confidenceLabel,
  };
}
