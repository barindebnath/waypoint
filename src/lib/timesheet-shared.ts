/** Shared timesheet constants/types — importable from client components (no DB). */

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

/** Official Accounts from Confluence Time Tracking spec */
export const OFFICIAL_ACCOUNTS = [
  { key: "CAP_DEV_NEW", name: "Development - New Enhancement", type: "CAPEX" },
  { key: "CAP_DES", name: "Design", type: "CAPEX" },
  { key: "CAP_DEV_DEFECT", name: "Development - New Enhancement Bug", type: "CAPEX" },
  { key: "CAP_TEST_NEW", name: "Testing - New Enhancement", type: "CAPEX" },
  { key: "CAP_DEPLOY_NEW", name: "Deployment - New Enhancement", type: "CAPEX" },
  { key: "OPX_PLAN", name: "Planning", type: "OPEX" },
  { key: "OPX_ADMIN", name: "Admin", type: "OPEX" },
  { key: "OPX_SUPPORT", name: "Maintenance / Support", type: "OPEX" },
  { key: "OPX_PTO", name: "PTO / Leave", type: "OPEX" },
  { key: "OPX_REQ", name: "Requirements", type: "OPEX" },
  { key: "OPX_RESEARCH", name: "Research", type: "OPEX" },
  { key: "OPX_TRAINING", name: "Training", type: "OPEX" },
  { key: "OPX_DEV_FIX", name: "Development - Production Bug Fix", type: "OPEX" },
  { key: "OPX_TEST_FIX", name: "Testing - Production Bug Fix", type: "OPEX" },
  { key: "OPX_DEPLOY_FIX", name: "Deployment - Production Bug Fix", type: "OPEX" },
  { key: "WAVE1DELIV", name: "Delivery", type: "CAPEX" },
];

/** Official Investment Categories from Confluence spec */
export const OFFICIAL_INVESTMENT_CATEGORIES = [
  "Feature Enhancement",
  "New Feature",
  "Admin / Interview",
  "BAU",
  "Defect",
  "Planning",
  "Platform Optimization",
  "Research",
  "Training",
];

export interface AutoTempoRule {
  issue?: string;
  account?: string;
  rule: string | string[];
  type?: string;
  skip?: boolean;
}

/** Company-wide Common Rules inherited by all employees by default */
export const SYSTEM_COMMON_RULES: AutoTempoRule[] = [
  { account: "OPX_PTO", issue: "39593", rule: "Out of office", type: "PTO / Leave" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["Meet and greet", "Chat with", "Weekly goal setting", "Fun day", "Firewarden Retro", "Firewarden / Support chat", "Education Engineering leads", "Firewarden handover"], type: "Admin / Interview" },
  { account: "OPX_PTO", issue: "39600", rule: "Public Holiday", type: "PTO / Leave" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["1-on-1", "1:1", "1-1", "PDP", "Goals"], type: "Admin / Interview" },
  { account: "OPX_ADMIN", issue: "197608", rule: "Town Hall", type: "Admin / Interview" },
  { account: "OPX_ADMIN", issue: "197608", rule: "Showcase", type: "Admin / Interview" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["PIR", "Internal PIR Review", "discussion", "Wow Group Meeting", "EDU SLT Meeting", "Discuss", "ITSM Review", "Working Group", "investigation", "Prioritisation", "Gravity DB Storage optimisation", "plan", "UK shenanigans", "Goals chat", "GG Posts chat", "Common services strategy", "Incident Management"], type: "Admin / Interview" },
  { account: "OPX_PLAN", issue: "197608", rule: "Story Time", type: "Planning" },
  { account: "OPX_ADMIN", issue: "197608", rule: "Engineering Monthly", type: "Admin / Interview" },
  { account: "OPX_SUPPORT", issue: "40814", rule: ["JIRA time", "Firewarden"], type: "BAU" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["Tech lead standup", "Tech lead catchup"], type: "Admin / Interview" },
  { account: "OPX_ADMIN", issue: "158608", rule: ["Standup", "Stand-up", "Stand up", "Catch up", "Catch-up", "Catchup"], type: "Admin / Interview" },
  { account: "OPX_ADMIN", issue: "158608", rule: "Retro", type: "Admin / Interview" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["Weekly program update", "Weekly milestone", "Weekly Engineering - Product Sync", "Elixir weekly updates", "Product / Eng - Heads", "Education tech leadership", "Retrospective"], type: "Admin / Interview" },
  { account: "OPX_ADMIN", issue: "158634", rule: "Virtual Lunch", type: "Admin / Interview" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["Timesheets", "Autotempo"], type: "Admin / Interview" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["EOY", "Roadmap"], type: "Admin / Interview" },
  { account: "OPX_ADMIN", issue: "158634", rule: "Interview", type: "Admin / Interview" },
  { account: "OPX_ADMIN", issue: "158634", rule: "Leaders", type: "Admin / Interview" },
  { account: "OPX_TRAINING", issue: "39597", rule: ["10% time", "Education Tech Meetup"], type: "Training" },
  { account: "OPX_TRAINING", issue: "39597", rule: "L&L", type: "Training" },
  { account: "OPX_TRAINING", issue: "39597", rule: "Lunch & Learn", type: "Training" },
  { account: "OPX_PLAN", issue: "158608", rule: "Tech Feasability", type: "Planning" },
  { account: "OPX_PTO", issue: "39593", rule: ["Leave", "Annual Leave", "Unpaid Leave", "Give Back day"], type: "PTO / Leave" },
  { account: "OPX_TRAINING", issue: "39597", rule: ["Elixir and Frontend Upskilling", "CCS and PES Upskilling"], type: "Training" },
  { account: "OPX_ADMIN", issue: "158634", rule: ["Meet and greet", "Chat with", "Intro"], type: "Admin / Interview" },
  { rule: "Update 1:1 spreadsheet", skip: true },
  { rule: "Funky Bunch Trivia", skip: true },
  { rule: "Buffer", skip: true },
  { rule: "Donut", skip: true },
  { rule: "New Starter Olympics", skip: true },
  { rule: "#donut-dates", skip: true },
];
