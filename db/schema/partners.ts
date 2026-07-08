import { randomUUID } from "crypto";
import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  index,
  numeric,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { team } from "./auth";
import { user } from "./auth";

export const partner = pgTable("partner", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** Optional base URL for redemption (e.g. https://partner.com/redeem). Links will be /r/{code}; this is shown to users. */
  redeemBaseUrl: text("redeem_base_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const creditDistributionTypeEnum = [
  "even",
  "excel_unique",
  "general_link",
] as const;
export type CreditDistributionType = (typeof creditDistributionTypeEnum)[number];

export const creditPool = pgTable(
  "credit_pool",
  {
    id: serial("id").primaryKey(),
    partnerId: integer("partner_id")
      .notNull()
      .references(() => partner.id, { onDelete: "cascade" }),
    totalAmount: numeric("total_amount", { precision: 18, scale: 4 }).notNull(),
    targetType: text("target_type", { enum: ["team", "participant"] }).notNull(),
    /** even = legacy floor split; excel_unique = per-user URLs from upload; general_link = one URL for all eligible users */
    distributionType: text("distribution_type", {
      enum: creditDistributionTypeEnum,
    })
      .notNull()
      .default("even"),
    /** When distributionType is general_link, participants see this URL until they claim. */
    generalCreditUrl: text("general_credit_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
    distributedAt: timestamp("distributed_at", { withTimezone: true }),
    distributedByUserId: text("distributed_by_user_id").references(() => user.id, { onDelete: "set null" }),
  },
  (t) => [
    index("credit_pool_partner_id_idx").on(t.partnerId),
    index("credit_pool_created_by_idx").on(t.createdByUserId),
  ]
);

export const teamCreditAllocation = pgTable(
  "team_credit_allocation",
  {
    id: serial("id").primaryKey(),
    creditPoolId: integer("credit_pool_id")
      .notNull()
      .references(() => creditPool.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 18, scale: 4 }).notNull(),
    status: text("status", {
      enum: ["assigned", "claimed", "used"],
    })
      .notNull()
      .default("assigned"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("team_credit_allocation_pool_idx").on(t.creditPoolId),
    index("team_credit_allocation_team_idx").on(t.teamId),
  ]
);

export const participantCreditAllocation = pgTable(
  "participant_credit_allocation",
  {
    id: serial("id").primaryKey(),
    creditPoolId: integer("credit_pool_id")
      .notNull()
      .references(() => creditPool.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 18, scale: 4 }).notNull(),
    status: text("status", {
      enum: ["assigned", "claimed", "used"],
    })
      .notNull()
      .default("assigned"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("participant_credit_allocation_pool_idx").on(t.creditPoolId),
    index("participant_credit_allocation_user_idx").on(t.userId),
    uniqueIndex("participant_credit_allocation_pool_user_unique").on(t.creditPoolId, t.userId),
  ]
);

export const partnerRelations = relations(partner, ({ many }) => ({
  creditPools: many(creditPool),
}));

export const creditPoolRelations = relations(creditPool, ({ one, many }) => ({
  partner: one(partner),
  teamAllocations: many(teamCreditAllocation),
  participantAllocations: many(participantCreditAllocation),
}));

export const teamCreditAllocationRelations = relations(
  teamCreditAllocation,
  ({ one, many }) => ({
    creditPool: one(creditPool),
    team: one(team),
    redemptionLinks: many(creditRedemptionLink),
  })
);

export const participantCreditAllocationRelations = relations(
  participantCreditAllocation,
  ({ one, many }) => ({
    creditPool: one(creditPool),
    user: one(user),
    redemptionLinks: many(creditRedemptionLink),
  })
);

/** One row per redeemable link. Each allocation has amount = number of links; we create that many rows here. */
export const creditRedemptionLink = pgTable(
  "credit_redemption_link",
  {
    id: serial("id").primaryKey(),
    teamAllocationId: integer("team_allocation_id").references(
      () => teamCreditAllocation.id,
      { onDelete: "cascade" }
    ),
    participantAllocationId: integer("participant_allocation_id").references(
      () => participantCreditAllocation.id,
      { onDelete: "cascade" }
    ),
    shortCode: text("short_code").notNull(),
    /** Sponsor-provided URL (excel_unique). When set, /r/{shortCode} redirects here. */
    fullUrl: text("full_url"),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("credit_redemption_link_short_code_unique").on(t.shortCode),
    index("credit_redemption_link_team_alloc_idx").on(t.teamAllocationId),
    index("credit_redemption_link_participant_alloc_idx").on(t.participantAllocationId),
  ]
);

export const creditUploadBatch = pgTable(
  "credit_upload_batch",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    creditPoolId: integer("credit_pool_id")
      .notNull()
      .references(() => creditPool.id, { onDelete: "cascade" }),
    uploadedByUserId: text("uploaded_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fileName: text("file_name"),
    rawRowCount: integer("raw_row_count").notNull(),
    dedupedRowCount: integer("deduped_row_count").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("credit_upload_batch_pool_idx").on(t.creditPoolId),
    index("credit_upload_batch_created_idx").on(t.createdAt),
  ]
);

export const creditPendingLinkStatusEnum = ["pending", "distributed", "revoked"] as const;

export const creditPendingLink = pgTable(
  "credit_pending_link",
  {
    id: serial("id").primaryKey(),
    creditPoolId: integer("credit_pool_id")
      .notNull()
      .references(() => creditPool.id, { onDelete: "cascade" }),
    uploadBatchId: text("upload_batch_id")
      .notNull()
      .references(() => creditUploadBatch.id, { onDelete: "cascade" }),
    /** Null = an available URL in the bag (assigned to a recipient at distribute time). */
    targetUserId: text("target_user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    fullUrl: text("full_url").notNull(),
    status: text("status", { enum: creditPendingLinkStatusEnum }).notNull().default("pending"),
    participantAllocationId: integer("participant_allocation_id").references(
      () => participantCreditAllocation.id,
      { onDelete: "set null" }
    ),
    redemptionLinkId: integer("redemption_link_id").references(() => creditRedemptionLink.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("credit_pending_link_pool_idx").on(t.creditPoolId),
    index("credit_pending_link_batch_idx").on(t.uploadBatchId),
    index("credit_pending_link_status_idx").on(t.status),
    index("credit_pending_link_target_user_idx").on(t.targetUserId),
  ]
);

export const creditAuditLog = pgTable(
  "credit_audit_log",
  {
    id: serial("id").primaryKey(),
    creditPoolId: integer("credit_pool_id")
      .notNull()
      .references(() => creditPool.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("credit_audit_log_pool_idx").on(t.creditPoolId),
    index("credit_audit_log_created_idx").on(t.createdAt),
  ]
);

export const creditRedemptionLinkRelations = relations(
  creditRedemptionLink,
  ({ one }) => ({
    teamAllocation: one(teamCreditAllocation),
    participantAllocation: one(participantCreditAllocation),
  })
);
