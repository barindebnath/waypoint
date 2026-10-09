"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client-api";

/** One sync calls Jira and GitHub once per row, so keep the interval wide. */
export const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;

/** Same key as the v1 dashboard, so both pages show the same "Synced …" time. */
const LAST_SYNCED_KEY = "waypoint_last_synced";

/**
 * Background integration sync for the Board view.
 *
 * - Runs once on mount, then every AUTO_SYNC_INTERVAL_MS while the tab is visible.
 * - If the tab was hidden for longer than the interval, it runs again on focus.
 * - The query cache keeps the result across page changes, so navigation
 *   back to the board does not start a new sync inside the interval.
 * - No retries: if Jira or GitHub fails, wait for the next interval.
 */
export function useAutoSync() {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["integrations-sync"],
    queryFn: async () => {
      const res = await api.syncIntegrations();
      localStorage.setItem(LAST_SYNCED_KEY, new Date().toISOString());
      // A sync can tick sub-tasks, so cards can change columns.
      await qc.invalidateQueries({ queryKey: ["rows"] });
      return res;
    },
    staleTime: AUTO_SYNC_INTERVAL_MS,
    gcTime: Infinity,
    refetchInterval: AUTO_SYNC_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
