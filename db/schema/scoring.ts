import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
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
