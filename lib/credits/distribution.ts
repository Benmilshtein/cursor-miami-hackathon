import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { AppError } from "@/lib/api/http";
import { db } from "@/db";
import {
  creditPendingLink,
  creditPool,
  creditRedemptionLink,
  participantCreditAllocation,
  teamCreditAllocation,
} from "@/db/schema/partners";
import { team } from "@/db/schema/auth";
import {
  getEligibleParticipantUserIds,
  getParticipantUserIdsForTeams,
  getParticipantsByIds,
  isUserEligibleForCredits,
} from "./eligible-participants";
import { generateUniqueShortCode } from "./short-code";

/**
 * Even distribution: floor(totalAmount / count) per entity.
 * Remainder stays in the pool (not allocated). Documented for callers.
 */
export async function distributePoolEvenlyToTeams(
  poolId: number,
  teamIds: number[],
  amountPerTeam: string,
) {
  if (teamIds.length === 0) return [];
  const values = teamIds.map((teamId) => ({
    creditPoolId: poolId,
    teamId,
    amount: amountPerTeam,
    status: "assigned" as const,
  }));
  const inserted = await db.insert(teamCreditAllocation).values(values).returning();
  return inserted;
}

export async function distributePoolEvenlyToParticipants(
  poolId: number,
  userIds: string[],
  amountPerUser: string,
) {
  if (userIds.length === 0) return [];
  const values = userIds.map((userId) => ({
    creditPoolId: poolId,
    userId,
    amount: amountPerUser,
    status: "assigned" as const,
  }));
  const inserted = await db.insert(participantCreditAllocation).values(values).returning();
  return inserted;
}

export async function getAllocatedTotalForPool(poolId: number) {
  const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
  if (!pool) return null;
  if (pool.targetType === "team") {
    const rows = await db
      .select({ sum: sql<string>`coalesce(sum(${teamCreditAllocation.amount}), 0)` })
      .from(teamCreditAllocation)
      .where(eq(teamCreditAllocation.creditPoolId, poolId));
    return rows[0]?.sum ?? "0";
  }
  const rows = await db
    .select({ sum: sql<string>`coalesce(sum(${participantCreditAllocation.amount}), 0)` })
    .from(participantCreditAllocation)
    .where(eq(participantCreditAllocation.creditPoolId, poolId));
  return rows[0]?.sum ?? "0";
}

/** Teams that passed screening (accepted). */
export async function getApprovedTeamIds(): Promise<number[]> {
  const rows = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.screeningStatus, "approved"));
  return rows.map((r) => r.id);
}

async function createRedemptionLinksForTeamAllocation(
  teamAllocationId: number,
  count: number,
): Promise<{ shortCode: string }[]> {
  const links: { shortCode: string }[] = [];
  for (let i = 0; i < count; i++) {
    const shortCode = await generateUniqueShortCode(async (code) => {
      const rows = await db
        .select({ id: creditRedemptionLink.id })
        .from(creditRedemptionLink)
        .where(eq(creditRedemptionLink.shortCode, code))
        .limit(1);
      return rows.length > 0;
    });
    await db.insert(creditRedemptionLink).values({
      teamAllocationId,
      shortCode,
    });
    links.push({ shortCode });
  }
  return links;
}

async function createRedemptionLinksForParticipantAllocation(
  participantAllocationId: number,
  count: number,
): Promise<{ shortCode: string }[]> {
  const links: { shortCode: string }[] = [];
  for (let i = 0; i < count; i++) {
    const shortCode = await generateUniqueShortCode(async (code) => {
      const rows = await db
        .select({ id: creditRedemptionLink.id })
        .from(creditRedemptionLink)
        .where(eq(creditRedemptionLink.shortCode, code))
        .limit(1);
      return rows.length > 0;
    });
    await db.insert(creditRedemptionLink).values({
      participantAllocationId,
      shortCode,
    });
    links.push({ shortCode });
  }
  return links;
}

export async function getDistributionPreview(poolId: number) {
  const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
  if (!pool) return null;

  const allocated = await getAllocatedTotalForPool(poolId);
  const total = Number(pool.totalAmount);
  const allocatedNum = Number(allocated ?? 0);
  const remainder = Math.max(0, total - allocatedNum);

  if (pool.distributionType === "excel_unique") {
    const [pendingResult] = await db
      .select({
        total: sql<number>`count(*)::int`,
        available: sql<number>`count(*) filter (where ${creditPendingLink.targetUserId} is null)::int`,
        targeted: sql<number>`count(*) filter (where ${creditPendingLink.targetUserId} is not null)::int`,
      })
      .from(creditPendingLink)
      .where(
        and(eq(creditPendingLink.creditPoolId, poolId), eq(creditPendingLink.status, "pending")),
      );
    return {
      poolId,
      targetType: pool.targetType,
      distributionType: pool.distributionType,
      totalAmount: total,
      alreadyAllocated: allocatedNum,
      remainder,
      recipientCount: 0,
      amountPerRecipient: 0,
      remainderLeftInPool: remainder,
      pendingLinkCount: pendingResult?.total ?? 0,
      availablePending: pendingResult?.available ?? 0,
      targetedPending: pendingResult?.targeted ?? 0,
    };
  }

  if (pool.distributionType === "general_link") {
    const eligibleIds = await getEligibleParticipantUserIds();
    const existing = await db
      .select({ userId: participantCreditAllocation.userId })
      .from(participantCreditAllocation)
      .where(eq(participantCreditAllocation.creditPoolId, poolId));
    const have = new Set(existing.map((e) => e.userId));
    const toCreate = eligibleIds.filter((id) => !have.has(id)).length;
    return {
      poolId,
      targetType: pool.targetType,
      distributionType: pool.distributionType,
      totalAmount: total,
      alreadyAllocated: allocatedNum,
      remainder,
      recipientCount: toCreate,
      amountPerRecipient: 1,
      remainderLeftInPool: remainder,
      pendingLinkCount: 0,
    };
  }

  const recipientIds =
    pool.targetType === "team"
      ? await getApprovedTeamIds()
      : await getEligibleParticipantUserIds();
  const count = recipientIds.length;
  const amountPerRecipient = count > 0 ? Math.floor(remainder / count) : 0;
  const allocatedInThisRound = amountPerRecipient * count;
  const remainderLeftInPool = remainder - allocatedInThisRound;
  return {
    poolId,
    targetType: pool.targetType,
    distributionType: pool.distributionType,
    totalAmount: total,
    alreadyAllocated: allocatedNum,
    remainder,
    recipientCount: count,
    amountPerRecipient,
    remainderLeftInPool,
    pendingLinkCount: 0,
  };
}

export async function runDistribution(poolId: number, distributedByUserId: string) {
  const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
  if (!pool) throw new AppError(404, "NOT_FOUND", "Pool not found.");

  if (pool.distributionType === "excel_unique") {
    throw new AppError(
      400,
      "USE_DISTRIBUTE_EXCEL",
      "Use “Distribute Excel links” for this pool type.",
    );
  }
  if (pool.distributionType === "general_link") {
    return runGeneralLinkDistribution(poolId, distributedByUserId);
  }

  const preview = await getDistributionPreview(poolId);
  if (!preview || preview.recipientCount === 0 || preview.amountPerRecipient <= 0) {
    return { distributed: 0, recipientCount: 0 };
  }
  const { amountPerRecipient, recipientCount, targetType } = preview;
  const amountStr = String(amountPerRecipient);

  if (targetType === "team") {
    const existing = await db
      .select()
      .from(teamCreditAllocation)
      .where(eq(teamCreditAllocation.creditPoolId, poolId));
    if (existing.length > 0) {
      for (const row of existing) {
        const newAmount = Number(row.amount) + amountPerRecipient;
        await db
          .update(teamCreditAllocation)
          .set({ amount: String(newAmount), updatedAt: new Date() })
          .where(eq(teamCreditAllocation.id, row.id));
        await createRedemptionLinksForTeamAllocation(row.id, amountPerRecipient);
      }
    } else {
      const teamIds = await getApprovedTeamIds();
      const inserted = await distributePoolEvenlyToTeams(poolId, teamIds, amountStr);
      for (const alloc of inserted) {
        await createRedemptionLinksForTeamAllocation(alloc.id, amountPerRecipient);
      }
    }
  } else {
    const existing = await db
      .select()
      .from(participantCreditAllocation)
      .where(eq(participantCreditAllocation.creditPoolId, poolId));
    if (existing.length > 0) {
      for (const row of existing) {
        const newAmount = Number(row.amount) + amountPerRecipient;
        await db
          .update(participantCreditAllocation)
          .set({ amount: String(newAmount), updatedAt: new Date() })
          .where(eq(participantCreditAllocation.id, row.id));
        await createRedemptionLinksForParticipantAllocation(row.id, amountPerRecipient);
      }
    } else {
      const userIds = await getEligibleParticipantUserIds();
      const inserted = await distributePoolEvenlyToParticipants(poolId, userIds, amountStr);
      for (const alloc of inserted) {
        await createRedemptionLinksForParticipantAllocation(alloc.id, amountPerRecipient);
      }
    }
  }

  await db
    .update(creditPool)
    .set({
      distributedAt: new Date(),
      distributedByUserId,
      updatedAt: new Date(),
    })
    .where(eq(creditPool.id, poolId));

  return {
    distributed: amountPerRecipient * recipientCount,
    recipientCount,
  };
}

export async function runGeneralLinkDistribution(poolId: number, distributedByUserId: string) {
  const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
  if (!pool) throw new AppError(404, "NOT_FOUND", "Pool not found.");
  if (pool.distributionType !== "general_link" || pool.targetType !== "participant") {
    throw new AppError(400, "INVALID_POOL", "General link pools must target participants.");
  }
  if (!pool.generalCreditUrl?.trim()) {
    throw new AppError(400, "MISSING_URL", "Set general credit URL before distributing.");
  }

  let created = 0;
  await db.transaction(async (tx) => {
    const eligibleIds = await getEligibleParticipantUserIds();
    const existing = await tx
      .select({ userId: participantCreditAllocation.userId })
      .from(participantCreditAllocation)
      .where(eq(participantCreditAllocation.creditPoolId, poolId));
    const have = new Set(existing.map((e) => e.userId));
    for (const userId of eligibleIds) {
      if (have.has(userId)) continue;
      await tx.insert(participantCreditAllocation).values({
        creditPoolId: poolId,
        userId,
        amount: "1",
        status: "assigned",
      });
      have.add(userId);
      created++;
    }
    await tx
      .update(creditPool)
      .set({
        distributedAt: new Date(),
        distributedByUserId,
        updatedAt: new Date(),
      })
      .where(eq(creditPool.id, poolId));
  });

  return { created };
}

export type UniqueDistributionScope =
  | { kind: "teams"; teamIds: number[] }
  | { kind: "participants"; userIds: string[] };

type PendingRow = typeof creditPendingLink.$inferSelect;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Create a participant allocation + redemption link from a staged URL, and mark the row distributed. */
async function assignPendingRowToUser(
  tx: Tx,
  poolId: number,
  userId: string,
  row: PendingRow,
): Promise<boolean> {
  const [insertedAlloc] = await tx
    .insert(participantCreditAllocation)
    .values({ creditPoolId: poolId, userId, amount: "1", status: "assigned" })
    .returning();
  if (!insertedAlloc) return false;

  const shortCode = await generateUniqueShortCode(async (code) => {
    const rows = await tx
      .select({ id: creditRedemptionLink.id })
      .from(creditRedemptionLink)
      .where(eq(creditRedemptionLink.shortCode, code))
      .limit(1);
    return rows.length > 0;
  });

  const [insertedLink] = await tx
    .insert(creditRedemptionLink)
    .values({ participantAllocationId: insertedAlloc.id, shortCode, fullUrl: row.fullUrl })
    .returning({ id: creditRedemptionLink.id });

  await tx
    .update(creditPendingLink)
    .set({
      status: "distributed",
      targetUserId: userId,
      participantAllocationId: insertedAlloc.id,
      redemptionLinkId: insertedLink?.id ?? null,
      updatedAt: new Date(),
    })
    .where(eq(creditPendingLink.id, row.id));

  return true;
}

/**
 * Assign staged unique URLs to chosen recipients (each gets one link they claim).
 * First flushes any pre-targeted rows to their target user, then pops untargeted
 * "available" URLs for recipients (members of selected teams, or selected
 * participants) who don't yet have an allocation in this pool. Repeatable: it
 * skips already-allocated users and stops when URLs run out.
 */
export async function runUniqueDistribution(
  poolId: number,
  distributedByUserId: string,
  scope: UniqueDistributionScope,
) {
  const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
  if (!pool) throw new AppError(404, "NOT_FOUND", "Pool not found.");
  if (pool.distributionType !== "excel_unique") {
    throw new AppError(400, "INVALID_POOL", "This action is only for Unique links (Excel) pools.");
  }

  const recipientIds =
    scope.kind === "teams"
      ? await getParticipantUserIdsForTeams(scope.teamIds)
      : await getParticipantsByIds(scope.userIds);

  return db.transaction(async (tx) => {
    const allocatedRows = await tx
      .select({ userId: participantCreditAllocation.userId })
      .from(participantCreditAllocation)
      .where(eq(participantCreditAllocation.creditPoolId, poolId));
    const allocated = new Set(allocatedRows.map((r) => r.userId));

    let assigned = 0;

    // 1. Flush any pre-targeted staged rows to their target user (legacy/template).
    const targetedRows = await tx
      .select()
      .from(creditPendingLink)
      .where(
        and(
          eq(creditPendingLink.creditPoolId, poolId),
          eq(creditPendingLink.status, "pending"),
          sql`${creditPendingLink.targetUserId} is not null`,
        ),
      )
      .orderBy(asc(creditPendingLink.id));
    for (const row of targetedRows) {
      const uid = row.targetUserId;
      if (!uid || allocated.has(uid)) continue;
      if (!(await isUserEligibleForCredits(uid))) continue;
      if (await assignPendingRowToUser(tx, poolId, uid, row)) {
        allocated.add(uid);
        assigned++;
      }
    }

    // 2. Pop untargeted "available" URLs for the chosen recipients.
    const available = await tx
      .select()
      .from(creditPendingLink)
      .where(
        and(
          eq(creditPendingLink.creditPoolId, poolId),
          eq(creditPendingLink.status, "pending"),
          isNull(creditPendingLink.targetUserId),
        ),
      )
      .orderBy(asc(creditPendingLink.id));

    let cursor = 0;
    let recipientsWithoutLink = 0;
    for (const uid of recipientIds) {
      if (allocated.has(uid)) continue;
      if (cursor >= available.length) {
        recipientsWithoutLink++;
        continue;
      }
      const row = available[cursor++];
      if (await assignPendingRowToUser(tx, poolId, uid, row)) {
        allocated.add(uid);
        assigned++;
      }
    }

    await tx
      .update(creditPool)
      .set({ distributedAt: new Date(), distributedByUserId, updatedAt: new Date() })
      .where(eq(creditPool.id, poolId));

    const [{ count: pendingLeft }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(creditPendingLink)
      .where(
        and(eq(creditPendingLink.creditPoolId, poolId), eq(creditPendingLink.status, "pending")),
      );

    return { assigned, pendingLeft: pendingLeft ?? 0, recipientsWithoutLink };
  });
}
