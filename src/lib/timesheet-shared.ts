/** Shared timesheet constants/types — importable from client components (no DB). */

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"] as const;
export type DayKey = (typeof DAY_KEYS)[number];
