import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { team, user } from "./auth";

export const teamMemberRoleEnum = pgEnum("team_member_role", ["lead", "member"]);

export const teamMember = pgTable(
  "team_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    teamId: integer("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: teamMemberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),
    removedByUserId: text("removed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("team_member_user_active_unique")
      .on(table.userId)
      .where(sql`${table.leftAt} is null`),
    uniqueIndex("team_member_team_lead_active_unique")
      .on(table.teamId)
      .where(sql`${table.leftAt} is null and ${table.role} = 'lead'`),
    index("team_member_team_active_idx").on(table.teamId, table.leftAt),
    index("team_member_user_idx").on(table.userId),
  ],
);

export const teamInvite = pgTable(
  "team_invite",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    teamId: integer("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").notNull().default(0),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("team_invite_code_unique").on(table.code),
    index("team_invite_team_id_idx").on(table.teamId),
    index("team_invite_revoked_at_idx").on(table.revokedAt),
    check(
      "team_invite_max_uses_check",
      sql`${table.maxUses} is null or ${table.maxUses} > 0`,
    ),
    check("team_invite_used_count_check", sql`${table.usedCount} >= 0`),
  ],
);
