import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Better Auth tables (user, session, account, verification, apikey)  */
/* Generated from the Better Auth CLI schema for the drizzle adapter. */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // derived from email prefix at signup — never collected (data minimization)
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Personal access tokens (Better Auth apiKey plugin). Hashed at rest, shown once, revocable. */
export const apikey = pgTable(
  "apikey",
  {
    id: text("id").primaryKey(),
    configId: text("config_id").notNull().default("default"),
    name: text("name"),
    start: text("start"),
    // The plugin generates this without an FK (it may reference orgs); we only
    // ever reference users, and the cascade is required for hard account deletion.
    referenceId: text("reference_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    prefix: text("prefix"),
    key: text("key").notNull(),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: timestamp("last_refill_at"),
    enabled: boolean("enabled").default(true),
    rateLimitEnabled: boolean("rate_limit_enabled").default(true),
    rateLimitTimeWindow: integer("rate_limit_time_window").default(60000),
    rateLimitMax: integer("rate_limit_max").default(240),
    requestCount: integer("request_count").default(0),
    remaining: integer("remaining"),
    lastRequest: timestamp("last_request"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    permissions: text("permissions"),
    metadata: text("metadata"),
  },
  (t) => [index("apikey_reference_idx").on(t.referenceId), index("apikey_key_idx").on(t.key)],
);

/* ------------------------------------------------------------------ */
/* Waypoint app tables                                                 */
/* ------------------------------------------------------------------ */

/** Per-user settings: timezone + link templates. One row per user. */
export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  colorTheme: text("color_theme").notNull().default("paper"),
  /** e.g. https://myxplorinfo.atlassian.net — Jira refs auto-link as {base}/browse/{ref} */
  jiraBaseUrl: text("jira_base_url"),
  /** e.g. https://github.com/xplor — PR refs `repo#123` auto-link as {base}/{repo}/pull/{123} */
  githubBaseUrl: text("github_base_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ExternalRef = {
  kind: "jira" | "github_pr" | "other";
  ref: string;
  url?: string;
};

export const ticketRow = pgTable(
  "ticket_row",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    origin: text("origin", { enum: ["support", "product"] }).notNull(),
    subType: text("sub_type", { enum: ["bug", "task"] }),
    /** Immutable after creation — pivots/promotions are new rows, never a switch. */
    pipelineKey: text("pipeline_key", {
      enum: ["support_full", "support_light", "feature"],
    }).notNull(),
    /** The row's identity: ZT card for support rows, OFF/PES card for product rows. Normalized uppercase. */
    identityRef: text("identity_ref").notNull(),
    /** Secondary pills: dupe project card, PRs, pivot back-references. May repeat across rows. */
    secondaryRefs: jsonb("secondary_refs").$type<ExternalRef[]>().notNull().default([]),
    /** Explicit URL override for the identity ref (link templates usually cover it). */
    identityUrl: text("identity_url"),
    currentMilestone: text("current_milestone").notNull(),
    isComplete: boolean("is_complete").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("ticket_row_user_identity_uq").on(t.userId, t.identityRef),
    index("ticket_row_user_idx").on(t.userId),
  ],
);

export const milestoneState = pgTable(
  "milestone_state",
  {
    rowId: uuid("row_id")
      .notNull()
      .references(() => ticketRow.id, { onDelete: "cascade" }),
    milestoneKey: text("milestone_key").notNull(),
    complete: boolean("complete").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.rowId, t.milestoneKey] })],
);

export const subtaskState = pgTable(
  "subtask_state",
  {
    rowId: uuid("row_id")
      .notNull()
      .references(() => ticketRow.id, { onDelete: "cascade" }),
    milestoneKey: text("milestone_key").notNull(),
    subtaskKey: text("subtask_key").notNull(),
    checked: boolean("checked").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.rowId, t.milestoneKey, t.subtaskKey] })],
);

export type TimesheetDay = { checked: boolean; updatedAt: string | null };
export type TimesheetDays = {
  mon: TimesheetDay;
  tue: TimesheetDay;
  wed: TimesheetDay;
  thu: TimesheetDay;
  fri: TimesheetDay;
};
export type TimesheetSubmit = { status: "open" | "submitted"; submittedAt: string | null };

export const timesheetWeek = pgTable(
  "timesheet_week",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** ISO week id, e.g. "2026-W29" */
    weekId: text("week_id").notNull(),
    days: jsonb("days").$type<TimesheetDays>().notNull(),
    submit: jsonb("submit").$type<TimesheetSubmit>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("timesheet_user_week_uq").on(t.userId, t.weekId)],
);

/** Pipeline definitions held as data so they can be edited without a deploy (seeded from src/lib/pipelines.ts). */
export const pipelineDefinition = pgTable("pipeline_definition", {
  key: text("key").primaryKey(),
  definition: jsonb("definition").notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Idempotency: a repeated write with the same key returns the stored response instead of re-applying. */
export const idempotencyKey = pgTable(
  "idempotency_key",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    response: jsonb("response").notNull(),
    status: integer("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] })],
);
