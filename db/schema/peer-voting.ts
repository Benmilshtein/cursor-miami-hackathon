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

/**
 * Crowd "Launch Credit" allocations for the peer-voting expo.
 *
 * Each participant has a budget of 3 credits total (enforced in the service
 * layer - it spans rows so it can't be a DB check). A row records how many
 * credits a voter gave to one team. `round` is the round during which the vote
 * was cast (1 = Group B votes on Group A; 2 = Group A votes on Group B) and is
 * what makes round-1 votes immutable once the phase advances to round 2.
 */
export const peerVote = pgTable(
  "peer_vote",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    voterUserId: text("voter_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    credits: integer("credits").notNull(),
    round: integer("round").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("peer_vote_voter_team_unique").on(table.voterUserId, table.teamId),
    index("peer_vote_team_idx").on(table.teamId),
    index("peer_vote_voter_round_idx").on(table.voterUserId, table.round),
    index("peer_vote_round_idx").on(table.round),
    check("peer_vote_credits_range", sql`${table.credits} >= 1 and ${table.credits} <= 3`),
    check("peer_vote_round_range", sql`${table.round} = 1 or ${table.round} = 2`),
  ],
);
