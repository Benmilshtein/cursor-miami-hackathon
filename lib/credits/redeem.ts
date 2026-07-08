import { and, eq, isNull } from "drizzle-orm";
import { AppError } from "@/lib/api/http";
import { db } from "@/db";
import {
  creditPool,
  creditRedemptionLink,
  partner,
  participantCreditAllocation,
  teamCreditAllocation,
} from "@/db/schema/partners";

export type RedeemLookup =
  | {
      found: true;
      shortCode: string;
      partnerName: string;
      redeemBaseUrl: string | null;
      /** When set (excel upload), /r page redirects to this URL. */
      fullUrl: string | null;
    }
  | { found: false };

/** Look up a redemption link by short code and return partner info for redirect or display. */
export async function lookupRedemptionByShortCode(code: string): Promise<RedeemLookup> {
  const normalized = code.trim().toLowerCase();
  const [link] = await db
    .select()
    .from(creditRedemptionLink)
    .where(eq(creditRedemptionLink.shortCode, normalized))
    .limit(1);
  if (!link || link.revokedAt) return { found: false };

  let poolId: number;
  if (link.teamAllocationId !== null) {
    const [alloc] = await db
      .select({ creditPoolId: teamCreditAllocation.creditPoolId })
      .from(teamCreditAllocation)
      .where(eq(teamCreditAllocation.id, link.teamAllocationId))
      .limit(1);
    if (!alloc) return { found: false };
    poolId = alloc.creditPoolId;
  } else if (link.participantAllocationId !== null) {
    const [alloc] = await db
      .select({ creditPoolId: participantCreditAllocation.creditPoolId })
      .from(participantCreditAllocation)
      .where(eq(participantCreditAllocation.id, link.participantAllocationId))
      .limit(1);
    if (!alloc) return { found: false };
    poolId = alloc.creditPoolId;
  } else {
    return { found: false };
  }

  const [pool] = await db
    .select({ partnerId: creditPool.partnerId })
    .from(creditPool)
    .where(eq(creditPool.id, poolId))
    .limit(1);
  if (!pool) return { found: false };

  const [p] = await db
    .select({ name: partner.name, redeemBaseUrl: partner.redeemBaseUrl })
    .from(partner)
    .where(eq(partner.id, pool.partnerId))
    .limit(1);
  if (!p) return { found: false };

  return {
    found: true,
    shortCode: link.shortCode,
    partnerName: p.name,
    redeemBaseUrl: p.redeemBaseUrl ?? null,
    fullUrl: link.fullUrl ?? null,
  };
}

export async function claimParticipantAllocation(userId: string, allocationId: number) {
  const [alloc] = await db
    .select()
    .from(participantCreditAllocation)
    .where(eq(participantCreditAllocation.id, allocationId))
    .limit(1);
  if (!alloc || alloc.userId !== userId) {
    throw new AppError(404, "NOT_FOUND", "Allocation not found.");
  }
  if (alloc.status === "claimed" || alloc.status === "used") {
    return { alreadyClaimed: true as const };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(participantCreditAllocation)
      .set({ status: "claimed", updatedAt: new Date() })
      .where(eq(participantCreditAllocation.id, allocationId));

    await tx
      .update(creditRedemptionLink)
      .set({ claimedAt: new Date() })
      .where(
        and(
          eq(creditRedemptionLink.participantAllocationId, allocationId),
          isNull(creditRedemptionLink.revokedAt),
        ),
      );
  });

  return { success: true as const };
}
