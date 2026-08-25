/** Shared timesheet constants/types — importable from client components (no DB). */

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

/** Official Accounts from Confluence Time Tracking spec */
export const OFFICIAL_ACCOUNTS = [
  { key: "CAP_DES", name: "Design", type: "CAPEX" },
  { key: "CAP_DEV_NEW", name: "Development - New Enhancement", type: "CAPEX" },
  { key: "CAP_DEV_DEFECT", name: "Development - New Enhancement Defect", type: "CAPEX" },
  { key: "CAP_TEST_NEW", name: "Testing - New Enhancement", type: "CAPEX" },
  { key: "CAP_DEPLOY_NEW", name: "Deployment - New Enhancement", type: "CAPEX" },
  { key: "OPX_PLAN", name: "Planning", type: "OPEX" },
  { key: "OPX_ADMIN", name: "Admin", type: "OPEX" },
  { key: "OPX_SUPPORT", name: "Maintenance / Support", type: "OPEX" },
  { key: "OPX_PTO", name: "PTO", type: "OPEX" },
  { key: "OPX_REQ", name: "Requirements", type: "OPEX" },
  { key: "OPX_RESEARCH", name: "Research", type: "OPEX" },
  { key: "OPX_TRAINING", name: "Training", type: "OPEX" },
  { key: "OPX_DEV_FIX", name: "Development - Production Bug Fix", type: "OPEX" },
  { key: "OPX_TEST_FIX", name: "Testing - Production Bug Fix", type: "OPEX" },
  { key: "OPX_DEPLOY_FIX", name: "Deployment - Production Bug Fix", type: "OPEX" },
  { key: "OPX_INTEGRATE", name: "Integration (One Time, Not Reusable)", type: "OPEX" },
] as const;

/** Mapping of Investment Categories to allowed Tempo Accounts */
export const INVESTMENT_CATEGORY_ACCOUNTS: Record<string, string[]> = {
  "Admin": ["OPX_ADMIN"],
  "BAU": ["OPX_SUPPORT"],
  "Defect": ["OPX_DEV_FIX", "OPX_DEPLOY_FIX", "OPX_TEST_FIX"],
  "Feature Enhancement": ["CAP_DEV_NEW", "CAP_DEV_DEFECT", "CAP_DEPLOY_NEW", "OPX_REQ", "CAP_TEST_NEW"],
  "M&A": ["OPX_INTEGRATE"],
  "New Feature": ["CAP_DEV_NEW", "CAP_DEPLOY_NEW", "CAP_DES", "OPX_REQ", "CAP_TEST_NEW"],
  "Planning": ["OPX_PLAN"],
  "Platform Optimization": ["OPX_SUPPORT"],
  "Research": ["OPX_RESEARCH"],
  "Training": ["OPX_TRAINING"],
  "Interview": ["OPX_ADMIN"],
};

/** Official Investment Categories */
export const OFFICIAL_INVESTMENT_CATEGORIES = [
  "Admin",
  "BAU",
  "Defect",
  "Feature Enhancement",
  "Interview",
  "M&A",
  "New Feature",
  "Planning",
  "Platform Optimization",
  "Research",
  "Training",
] as const;

export interface AdminIssueRule {
  summary_contains?: string;
  summary_equals?: string;
  key?: string;
  allowed: string[];
}

export const ADMIN_ISSUES: AdminIssueRule[] = [
  { summary_contains: "Leave / PTO", allowed: ["OPX_PTO"] },
  { summary_contains: "Public Holiday", allowed: ["OPX_PTO"] },
  { summary_contains: "Company or Department Meeting", allowed: ["OPX_ADMIN"] },
  { summary_contains: "General Administrative Time", allowed: ["OPX_TRAINING", "OPX_ADMIN"] },
  { summary_equals: "Training", key: "AT-4", allowed: ["OPX_TRAINING"] },
  { summary_contains: "Agile Processes", key: "EN-1179", allowed: ["OPX_PLAN", "OPX_ADMIN"] },
  { summary_contains: "Support Tickets", key: "OFF-419", allowed: ["OPX_SUPPORT"] },
];

export const ADMIN_PROJECT_KEYS = ["AT"] as const;

export const ALWAYS_ALLOWED_ON_PROJECT_ISSUES = ["OPX_PLAN", "OPX_RESEARCH"] as const;

export const MAX_DAILY_HOURS = 12;

export interface AutoTempoRule {
  issue?: string;
  account?: string;
  rule: string | string[];
  type?: string;
  skip?: boolean;
}

/** Company-wide Common Rules inherited by all employees by default */
export const SYSTEM_COMMON_RULES: AutoTempoRule[] = [
  { account: "OPX_PTO", issue: "39593", rule: "Out of office", type: "PTO" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["Meet and greet", "Chat with", "Weekly goal setting", "Fun day", "Firewarden Retro", "Firewarden / Support chat", "Education Engineering leads", "Firewarden handover"], type: "Admin" },
  { account: "OPX_PTO", issue: "39600", rule: "Public Holiday", type: "PTO" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["1-on-1", "1:1", "1-1", "PDP", "Goals"], type: "Admin" },
  { account: "OPX_ADMIN", issue: "197608", rule: "Town Hall", type: "Admin" },
  { account: "OPX_ADMIN", issue: "197608", rule: "Showcase", type: "Admin" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["PIR", "Internal PIR Review", "discussion", "Wow Group Meeting", "EDU SLT Meeting", "Discuss", "ITSM Review", "Working Group", "investigation", "Prioritisation", "Gravity DB Storage optimisation", "plan", "UK shenanigans", "Goals chat", "GG Posts chat", "Common services strategy", "Incident Management"], type: "Admin" },
  { account: "OPX_PLAN", issue: "197608", rule: "Story Time", type: "Planning" },
  { account: "OPX_ADMIN", issue: "197608", rule: "Engineering Monthly", type: "Admin" },
  { account: "OPX_SUPPORT", issue: "40814", rule: ["JIRA time", "Firewarden"], type: "BAU" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["Tech lead standup", "Tech lead catchup"], type: "Admin" },
  { account: "OPX_ADMIN", issue: "158608", rule: ["Standup", "Stand-up", "Stand up", "Catch up", "Catch-up", "Catchup"], type: "Admin" },
  { account: "OPX_ADMIN", issue: "158608", rule: "Retro", type: "Admin" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["Weekly program update", "Weekly milestone", "Weekly Engineering - Product Sync", "Elixir weekly updates", "Product / Eng - Heads", "Education tech leadership", "Retrospective"], type: "Admin" },
  { account: "OPX_ADMIN", issue: "158634", rule: "Virtual Lunch", type: "Admin" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["Timesheets", "Autotempo"], type: "Admin" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["EOY", "Roadmap"], type: "Admin" },
  { account: "OPX_ADMIN", issue: "158634", rule: "Interview", type: "Interview" },
  { account: "OPX_ADMIN", issue: "158634", rule: "Leaders", type: "Admin" },
  { account: "OPX_TRAINING", issue: "39597", rule: ["10% time", "Education Tech Meetup"], type: "Training" },
  { account: "OPX_TRAINING", issue: "39597", rule: "L&L", type: "Training" },
  { account: "OPX_TRAINING", issue: "39597", rule: "Lunch & Learn", type: "Training" },
  { account: "OPX_PLAN", issue: "158608", rule: "Tech Feasability", type: "Planning" },
  { account: "OPX_PTO", issue: "39593", rule: ["Leave", "Annual Leave", "Unpaid Leave", "Give Back day"], type: "PTO" },
  { account: "OPX_TRAINING", issue: "39597", rule: ["Elixir and Frontend Upskilling", "CCS and PES Upskilling"], type: "Training" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["Meet and greet", "Chat with", "Intro"], type: "Admin" },
  { rule: "Update 1:1 spreadsheet", skip: true },
  { rule: "Funky Bunch Trivia", skip: true },
  { rule: "Buffer", skip: true },
  { rule: "Donut", skip: true },
  { rule: "New Starter Olympics", skip: true },
  { rule: "#donut-dates", skip: true },
];
