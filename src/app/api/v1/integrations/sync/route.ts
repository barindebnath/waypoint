import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { handle } from "@/lib/api-helpers";
import { db, schema } from "@/lib/db";
import { listRows, setSubtask } from "@/lib/engine";
import { fetchGithubPrStatus, parseGithubOrg, parsePrRef } from "@/lib/github";
import { fetchJiraIssueStatus } from "@/lib/jira";
import { eq } from "drizzle-orm";

export async function POST() {
  return handle(async () => {
    const user = await requireUser({ write: true });
    const userId = user.userId;

    const rows = await listRows(userId);
    const settings = await db.query.userSettings.findFirst({
      where: eq(schema.userSettings.userId, userId),
    });

    if (!settings) {
      return NextResponse.json({
        success: true,
        syncedJiraCount: 0,
        syncedGithubCount: 0,
        messages: ["No integration settings configured."],
      });
    }

    let syncedJiraCount = 0;
    let syncedGithubCount = 0;
    const messages: string[] = [];

    const defaultOrg =
      settings.githubDefaultOrg ||
      parseGithubOrg(settings.githubBaseUrl || "").org ||
      undefined;

    await Promise.allSettled(
      rows.map(async (row) => {
        // 1. Sync Jira card status
        if (settings.jiraEmail && settings.jiraApiToken && settings.jiraBaseUrl) {
          try {
            const jiraStatus = await fetchJiraIssueStatus(
              settings.jiraBaseUrl,
              settings.jiraEmail,
              settings.jiraApiToken,
              row.identityRef
            );

            if (jiraStatus) {
              syncedJiraCount++;
              await db
                .insert(schema.jiraStatusCache)
                .values({
                  cardRef: row.identityRef,
                  userId,
                  statusName: jiraStatus.statusName,
                  statusCategory: jiraStatus.statusCategory,
                  updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                  target: schema.jiraStatusCache.cardRef,
                  set: {
                    statusName: jiraStatus.statusName,
                    statusCategory: jiraStatus.statusCategory,
                    updatedAt: new Date(),
                  },
                });

              // Auto-advance Jira sub-tasks if sub-tasks exist on row
              try {
                const normalizedStatus = jiraStatus.statusName.toLowerCase();
                if (normalizedStatus.includes("in progress")) {
                  if (row.pipelineKey === "feature") {
                    await setSubtask(userId, row.identityRef, "definition", "moved_in_progress", true).catch(() => {});
                    await setSubtask(userId, row.identityRef, "development", "worked_on_card", true).catch(() => {});
                  }
                } else if (normalizedStatus.includes("code review")) {
                  await setSubtask(userId, row.identityRef, "development", "card_code_review", true).catch(() => {});
                } else if (normalizedStatus.includes("ready for qa")) {
                  await setSubtask(userId, row.identityRef, "staging", "card_ready_for_qa", true).catch(() => {});
                } else if (normalizedStatus.includes("done")) {
                  if (row.pipelineKey === "feature") {
                    await setSubtask(userId, row.identityRef, "prod_close", "card_done", true).catch(() => {});
                  } else {
                    await setSubtask(userId, row.identityRef, "prod_close", "comment_project_card", true).catch(() => {});
                  }
                }
              } catch (e) {
                // Ignore subtask auto-advance errors if subtask key doesn't exist on this row's pipeline
              }
            }
          } catch (e) {
            // Ignore single row Jira sync failure
          }
        }

        // 2. Sync GitHub PR ref
        const prRefObj = row.secondaryRefs.find((r) => r.kind === "github_pr");
        if (prRefObj) {
          const parsed = parsePrRef(prRefObj.ref, defaultOrg);
          if (!parsed) {
            messages.push(
              `Could not parse GitHub ref '${prRefObj.ref}' for card ${row.identityRef}. Please specify repo#123 with GitHub Org in Settings, or use owner/repo#123 / full URL.`
            );
          } else {
            try {
              const res = await fetchGithubPrStatus(
                settings.githubPat,
                parsed.owner,
                parsed.repo,
                parsed.pullNumber
              );

              if (res.success) {
                syncedGithubCount++;
                const githubDetails = res.details;
                // Insert cache for stored ref
                await db
                  .insert(schema.prStatusCache)
                  .values({
                    prRef: prRefObj.ref,
                    userId,
                    state: githubDetails.state,
                    mergeableState: githubDetails.mergeableState,
                    reviewDecision: githubDetails.reviewDecision,
                    updatedAt: new Date(),
                  })
                  .onConflictDoUpdate({
                    target: schema.prStatusCache.prRef,
                    set: {
                      state: githubDetails.state,
                      mergeableState: githubDetails.mergeableState,
                      reviewDecision: githubDetails.reviewDecision,
                      updatedAt: new Date(),
                    },
                  });

                // Also insert for parsed.fullRef if different e.g. owner/repo#123
                if (parsed.fullRef !== prRefObj.ref) {
                  await db
                    .insert(schema.prStatusCache)
                    .values({
                      prRef: parsed.fullRef,
                      userId,
                      state: githubDetails.state,
                      mergeableState: githubDetails.mergeableState,
                      reviewDecision: githubDetails.reviewDecision,
                      updatedAt: new Date(),
                    })
                    .onConflictDoUpdate({
                      target: schema.prStatusCache.prRef,
                      set: {
                        state: githubDetails.state,
                        mergeableState: githubDetails.mergeableState,
                        reviewDecision: githubDetails.reviewDecision,
                        updatedAt: new Date(),
                      },
                    });
                }

                // Auto-advance GitHub sub-tasks
                try {
                  await setSubtask(userId, row.identityRef, "development", "pr_raised", true).catch(() => {});
                  if (githubDetails.reviewDecision === "approved") {
                    await setSubtask(userId, row.identityRef, "qa_review", "pr_reviewed", true).catch(() => {});
                  }
                  if (githubDetails.state === "merged") {
                    await setSubtask(userId, row.identityRef, "prod_close", "merged_main", true).catch(() => {});
                  }
                } catch (e) {
                  // Ignore if pipeline sub-task isn't present
                }
              } else {
                messages.push(`PR ${prRefObj.ref}: ${res.error}`);
              }
            } catch (e) {
              // Ignore single row GitHub sync failure
            }
          }
        }
      })
    );

    return NextResponse.json({
      success: true,
      syncedJiraCount,
      syncedGithubCount,
      messages,
    });
  });
}
