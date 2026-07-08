import { randomUUID } from "crypto";
import { index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { team, user } from "./auth";

export const mentorRequestStatusEnum = pgEnum("mentor_request_status", [
  "pending",
  "assigned",
  "matched",
  "completed",
  "cancelled",
]);

export const mentorRequest = pgTable(
  "mentor_request",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    teamId: integer("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    status: mentorRequestStatusEnum("status").notNull().default("pending"),
    assignedMentorId: text("assigned_mentor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    acceptedMentorId: text("accepted_mentor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    declinedMentorIds: text("declined_mentor_ids").array().notNull().default([]),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    matchedAt: timestamp("matched_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (table) => [
    index("mentor_request_team_idx").on(table.teamId),
    index("mentor_request_status_idx").on(table.status),
    index("mentor_request_assigned_mentor_idx").on(table.assignedMentorId),
    index("mentor_request_accepted_mentor_idx").on(table.acceptedMentorId),
  ],
);
