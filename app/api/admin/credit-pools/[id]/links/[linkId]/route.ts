import type { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  creditPool,
  creditRedemptionLink,
  participantCreditAllocation,
} from "@/db/schema/partners";
import { user } from "@/db/schema/auth";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { isUserEligibleForCredits } from "@/lib/credits/eligible-participants";
import { logCreditAudit } from "@/lib/credits/audit";

type Params = { params: Promise<{ id: string; linkId: string }> };

function parsePoolId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) {
    throw new AppError(400, "INVALID_ID", "Invalid pool id.");
  }
  return n;
}

function parseLinkId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) {
    throw new AppError(400, "INVALID_ID", "Invalid link id.");
  }
  return n;
}

/** PATCH: revoke link or reassign allocation to another user. Body: { action: "revoke" } | { action: "reassign", newUserId: string } */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireSuperAdminUser(request);
    const poolId = parsePoolId((await params).id);
    const linkId = parseLinkId((await params).linkId);
    const body = await parseJsonBody<{ action: string; newUserId?: string }>(request);

    const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
    if (!pool) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");

    const [link] = await db
      .select()
      .from(creditRedemptionLink)
      .where(eq(creditRedemptionLink.id, linkId))
      .limit(1);
    if (!link || link.participantAllocationId === null) {
      throw new AppError(404, "NOT_FOUND", "Participant link not found.");
    }

    const [alloc] = await db
      .select()
      .from(participantCreditAllocation)
      .where(
        and(
          eq(participantCreditAllocation.id, link.participantAllocationId),
          eq(participantCreditAllocation.creditPoolId, poolId),
        ),
      )
      .limit(1);
    if (!alloc) throw new AppError(404, "NOT_FOUND", "Allocation not found for this pool.");

    if (body.action === "revoke") {
      await db
        .update(creditRedemptionLink)
        .set({ revokedAt: new Date() })
        .where(eq(creditRedemptionLink.id, linkId));
      await logCreditAudit(poolId, actor.id, "link_revoke", { linkId, allocationId: alloc.id });
      return jsonSuccess({ revoked: true });
    }

    if (body.action === "reassign") {
      const newUserId = typeof body.newUserId === "string" ? body.newUserId.trim() : "";
      if (!newUserId) {
        throw new AppError(400, "INVALID_INPUT", "newUserId is required.");
      }
      if (newUserId === alloc.userId) {
        throw new AppError(400, "INVALID_INPUT", "User is already assigned.");
      }
      const [targetUser] = await db.select().from(user).where(eq(user.id, newUserId)).limit(1);
      if (!targetUser) {
        throw new AppError(404, "NOT_FOUND", "Target user not found.");
      }
      const eligible = await isUserEligibleForCredits(newUserId);
      if (!eligible) {
        throw new AppError(400, "NOT_ELIGIBLE", "Target user is not an accepted participant.");
      }
      const [other] = await db
        .select({ id: participantCreditAllocation.id })
        .from(participantCreditAllocation)
        .where(
          and(
            eq(participantCreditAllocation.creditPoolId, poolId),
            eq(participantCreditAllocation.userId, newUserId),
          ),
        )
        .limit(1);
      if (other && other.id !== alloc.id) {
        throw new AppError(409, "CONFLICT", "Target user already has credits in this pool.");
      }

      await db.transaction(async (tx) => {
        await tx
          .update(participantCreditAllocation)
          .set({ userId: newUserId, updatedAt: new Date() })
          .where(eq(participantCreditAllocation.id, alloc.id));
        await tx
          .update(creditRedemptionLink)
          .set({ claimedAt: null })
          .where(eq(creditRedemptionLink.id, linkId));
      });

      await logCreditAudit(poolId, actor.id, "link_reassign", {
        linkId,
        allocationId: alloc.id,
        previousUserId: alloc.userId,
        newUserId,
      });
      return jsonSuccess({ reassigned: true, newUserId });
    }

    throw new AppError(400, "INVALID_INPUT", "action must be revoke or reassign.");
  } catch (e) {
    return toErrorResponse(e);
  }
}
