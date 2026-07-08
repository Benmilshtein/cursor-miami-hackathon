import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  creditPool,
  creditRedemptionLink,
  participantCreditAllocation,
  partner,
} from "@/db/schema/partners";

export type ParticipantCreditItem = {
  allocationId: number;
  poolId: number;
  partnerName: string;
  distributionType: string;
  status: string;
  generalCreditUrl: string | null;
  links: {
    id: number;
    shortCode: string;
    fullUrl: string | null;
    claimedAt: string | null;
    revokedAt: string | null;
    appRedeemPath: string;
  }[];
};

export async function getParticipantCreditsForUser(userId: string): Promise<ParticipantCreditItem[]> {
  const allocs = await db
    .select({
      allocationId: participantCreditAllocation.id,
      poolId: participantCreditAllocation.creditPoolId,
      status: participantCreditAllocation.status,
      distributionType: creditPool.distributionType,
      generalCreditUrl: creditPool.generalCreditUrl,
      partnerName: partner.name,
    })
    .from(participantCreditAllocation)
    .innerJoin(creditPool, eq(participantCreditAllocation.creditPoolId, creditPool.id))
    .innerJoin(partner, eq(creditPool.partnerId, partner.id))
    .where(eq(participantCreditAllocation.userId, userId));

  if (allocs.length === 0) return [];

  const allocIds = allocs.map((a) => a.allocationId);
  const links = await db
    .select({
      id: creditRedemptionLink.id,
      participantAllocationId: creditRedemptionLink.participantAllocationId,
      shortCode: creditRedemptionLink.shortCode,
      fullUrl: creditRedemptionLink.fullUrl,
      claimedAt: creditRedemptionLink.claimedAt,
      revokedAt: creditRedemptionLink.revokedAt,
    })
    .from(creditRedemptionLink)
    .where(
      and(
        inArray(creditRedemptionLink.participantAllocationId, allocIds),
        isNull(creditRedemptionLink.revokedAt),
      ),
    );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const pathPrefix = baseUrl ? `${baseUrl.replace(/\/$/, "")}/r/` : "/r/";

  const byAlloc = new Map<number, typeof links>();
  for (const l of links) {
    const pid = l.participantAllocationId;
    if (pid === null) continue;
    const list = byAlloc.get(pid) ?? [];
    list.push(l);
    byAlloc.set(pid, list);
  }

  return allocs.map((a) => ({
    allocationId: a.allocationId,
    poolId: a.poolId,
    partnerName: a.partnerName,
    distributionType: a.distributionType,
    status: a.status,
    generalCreditUrl: a.generalCreditUrl,
    links: (byAlloc.get(a.allocationId) ?? []).map((l) => ({
      id: l.id,
      shortCode: l.shortCode,
      fullUrl: l.fullUrl,
      claimedAt: l.claimedAt?.toISOString() ?? null,
      revokedAt: l.revokedAt?.toISOString() ?? null,
      appRedeemPath: `${pathPrefix}${l.shortCode}`,
    })),
  }));
}
