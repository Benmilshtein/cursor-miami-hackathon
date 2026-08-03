import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { team, user } from "./auth";

export const judgeScore = pgTable(
  "judge_score",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    teamId: integer("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    judgeUserId: text("judge_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    innovation: integer("innovation").notNull().default(0),
    technicalExecution: integer("technical_execution").notNull().default(0),
    aiUsage: integer("ai_usage").notNull().default(0),
    uxUi: integer("ux_ui").notNull().default(0),
    businessPotential: integer("business_potential").notNull().default(0),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("judge_score_team_judge_unique").on(table.teamId, table.judgeUserId),
    index("judge_score_team_idx").on(table.teamId),
    index("judge_score_judge_idx").on(table.judgeUserId),
    check("judge_score_innovation_range", sql`${table.innovation} >= 0 and ${table.innovation} <= 25`),
    check("judge_score_technical_range", sql`${table.technicalExecution} >= 0 and ${table.technicalExecution} <= 25`),
    check("judge_score_ai_range", sql`${table.aiUsage} >= 0 and ${table.aiUsage} <= 20`),
    check("judge_score_ux_range", sql`${table.uxUi} >= 0 and ${table.uxUi} <= 15`),
    check("judge_score_business_range", sql`${table.businessPotential} >= 0 and ${table.businessPotential} <= 15`),
  ],
);

/**
 * Step 3 of judging: one judge's score for one finalist's staged pitch.
 *
 * Separate from `judge_score` on purpose - that one rates the build over the
 * night, this one rates a 90-second presentation, and a judge fills them in at
 * different times against different criteria. Delivery + clarity + impact = 100.
 *
 * Only finalists are pitched and scored; the pitch average is what orders the
 * finalists on the final leaderboard (see lib/scoring/placement.ts).
 */
export const pitchScore = pgTable(
  "pitch_score",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    teamId: integer("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    judgeUserId: text("judge_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    delivery: integer("delivery").notNull().default(0),
    clarity: integer("clarity").notNull().default(0),
    impact: integer("impact").notNull().default(0),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("pitch_score_team_judge_unique").on(table.teamId, table.judgeUserId),
    index("pitch_score_team_idx").on(table.teamId),
    index("pitch_score_judge_idx").on(table.judgeUserId),
    check("pitch_score_delivery_range", sql`${table.delivery} >= 0 and ${table.delivery} <= 30`),
    check("pitch_score_clarity_range", sql`${table.clarity} >= 0 and ${table.clarity} <= 30`),
    check("pitch_score_impact_range", sql`${table.impact} >= 0 and ${table.impact} <= 40`),
  ],
);

/**
 * Step 1 of judging: cached result of the automated GitHub requirements check
 * (PRD + .cursorrules committed, and public app URL submitted, all within the
 * first hour of the hackathon). One row per team, refreshed by an admin action -
 * judges read the cache so the judge dashboard never hits the GitHub API.
 *
 * This is a flag, not a gate: a failing team is still scorable.
 */
export const repoCheck = pgTable("repo_check", {
  teamId: integer("team_id")
    .primaryKey()
    .references(() => team.id, { onDelete: "cascade" }),
  hasPrd: boolean("has_prd").notNull().default(false),
  hasCursorRules: boolean("has_cursor_rules").notNull().default(false),
  hasAppUrl: boolean("has_app_url").notNull().default(false),
  /** True only when all three requirements are present AND inside the T0 + 1h window. */
  onTime: boolean("on_time").notNull().default(false),
  /** JSON blob: matched paths, per-requirement timestamps, and any error reason. */
  details: text("details"),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
});
