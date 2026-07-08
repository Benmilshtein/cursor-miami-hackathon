import type { NextRequest } from "next/server";
import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import {
  creditRedemptionLink,
  creditPool,
  participantCreditAllocation,
  teamCreditAllocation,
} from "@/db/schema/partners";
import { user } from "@/db/schema/auth";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

function parsePoolId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) {
    throw new AppError(400, "INVALID_ID", "Invalid pool id.");
  }
  return n;
}

/** GET: list redemption links for this pool (with participant user id / email when applicable). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireSuperAdminUser(request);
    const poolId = parsePoolId((await params).id);
    const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
    if (!pool) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const pathPrefix = baseUrl ? `${baseUrl.replace(/\/$/, "")}/r/` : "/r/";

    const teamAllocIds = await db
      .select({ id: teamCreditAllocation.id })
      .from(teamCreditAllocation)
      .where(eq(teamCreditAllocation.creditPoolId, poolId));
    const participantAllocIds = await db
      .select({ id: participantCreditAllocation.id })
      .from(participantCreditAllocation)
      .where(eq(participantCreditAllocation.creditPoolId, poolId));

    const teamIds = teamAllocIds.map((r) => r.id);
    const participantIds = participantAllocIds.map((r) => r.id);

    if (teamIds.length === 0 && participantIds.length === 0) {
      return jsonSuccess({ links: [], total: 0 });
    }

    const fullCondition =
      teamIds.length > 0 && participantIds.length > 0
        ? or(
            inArray(creditRedemptionLink.teamAllocationId, teamIds),
            inArray(creditRedemptionLink.participantAllocationId, participantIds),
          )!
        : teamIds.length > 0
          ? inArray(creditRedemptionLink.teamAllocationId, teamIds)
          : inArray(creditRedemptionLink.participantAllocationId, participantIds);

    const links = await db
      .select({
        id: creditRedemptionLink.id,
        shortCode: creditRedemptionLink.shortCode,
        fullUrl: creditRedemptionLink.fullUrl,
        claimedAt: creditRedemptionLink.claimedAt,
        revokedAt: creditRedemptionLink.revokedAt,
        createdAt: creditRedemptionLink.createdAt,
        participantAllocationId: creditRedemptionLink.participantAllocationId,
      })
      .from(creditRedemptionLink)
      .where(fullCondition);

    const partAllocIds = links
      .map((l) => l.participantAllocationId)
      .filter((id): id is number => id !== null);

    const allocUsers =
      partAllocIds.length > 0
        ? await db
            .select({
              allocId: participantCreditAllocation.id,
              userId: participantCreditAllocation.userId,
              email: user.email,
            })
            .from(participantCreditAllocation)
            .innerJoin(user, eq(participantCreditAllocation.userId, user.id))
            .where(inArray(participantCreditAllocation.id, partAllocIds))
        : [];

    const allocById = new Map(allocUsers.map((a) => [a.allocId, a]));

    const withUrl = links.map((l) => {
      const part = l.participantAllocationId
        ? allocById.get(l.participantAllocationId)
        : undefined;
      return {
        id: l.id,
        shortCode: l.shortCode,
        fullUrl: l.fullUrl,
        claimedAt: l.claimedAt?.toISOString() ?? null,
        revokedAt: l.revokedAt?.toISOString() ?? null,
        createdAt: l.createdAt.toISOString(),
        url: `${pathPrefix}${l.shortCode}`,
        participantUserId: part?.userId ?? null,
        participantEmail: part?.email ?? null,
      };
    });

    return jsonSuccess({ links: withUrl, total: withUrl.length });
  } catch (error) {
    return toErrorResponse(error);
  }
}
