import type { NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { creditPendingLink, creditPool, partner } from "@/db/schema/partners";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { getAllocatedTotalForPool } from "@/lib/credits/distribution";

type Params = { params: Promise<{ id: string }> };

function parsePoolId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) {
    throw new AppError(400, "INVALID_ID", "Invalid pool id.");
  }
  return n;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireSuperAdminUser(request);
    const poolId = parsePoolId((await params).id);
    const [row] = await db
      .select({
        id: creditPool.id,
        partnerId: creditPool.partnerId,
        partnerName: partner.name,
        totalAmount: creditPool.totalAmount,
        targetType: creditPool.targetType,
        distributionType: creditPool.distributionType,
        generalCreditUrl: creditPool.generalCreditUrl,
        createdAt: creditPool.createdAt,
        createdByUserId: creditPool.createdByUserId,
        distributedAt: creditPool.distributedAt,
        distributedByUserId: creditPool.distributedByUserId,
      })
      .from(creditPool)
      .innerJoin(partner, eq(creditPool.partnerId, partner.id))
      .where(eq(creditPool.id, poolId))
      .limit(1);
    if (!row) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");
    const allocated = await getAllocatedTotalForPool(poolId);
    const [{ count: pendingLinkCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(creditPendingLink)
      .where(
        and(
          eq(creditPendingLink.creditPoolId, poolId),
          eq(creditPendingLink.status, "pending"),
        ),
      );
    return jsonSuccess({
      ...row,
      allocatedTotal: allocated ?? "0",
      remainder: String(Math.max(0, Number(row.totalAmount) - Number(allocated ?? 0))),
      pendingLinkCount: pendingLinkCount ?? 0,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** PATCH: add credits ({ addAmount }) or set general sponsor URL ({ generalCreditUrl }) for general_link pools. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireSuperAdminUser(request);
    const poolId = parsePoolId((await params).id);
    const body = await parseJsonBody<{ addAmount?: number; generalCreditUrl?: string | null }>(
      request,
    );
    const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
    if (!pool) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");

    if (body.generalCreditUrl !== undefined) {
      if (pool.distributionType !== "general_link") {
        throw new AppError(400, "INVALID_POOL", "General URL applies only to general link pools.");
      }
      const url = typeof body.generalCreditUrl === "string" ? body.generalCreditUrl.trim() : "";
      const [updated] = await db
        .update(creditPool)
        .set({
          generalCreditUrl: url || null,
          updatedAt: new Date(),
        })
        .where(eq(creditPool.id, poolId))
        .returning();
      if (!updated) throw new AppError(500, "UPDATE_FAILED", "Failed to update pool.");
      return jsonSuccess({ generalCreditUrl: updated.generalCreditUrl });
    }

    const addAmount = typeof body.addAmount === "number" ? body.addAmount : NaN;
    if (!Number.isFinite(addAmount) || addAmount <= 0) {
      throw new AppError(400, "INVALID_INPUT", "Provide addAmount (positive) or generalCreditUrl.");
    }
    const newTotal = Number(pool.totalAmount) + addAmount;
    const [updated] = await db
      .update(creditPool)
      .set({ totalAmount: String(newTotal), updatedAt: new Date() })
      .where(eq(creditPool.id, poolId))
      .returning();
    if (!updated) throw new AppError(500, "UPDATE_FAILED", "Failed to update pool.");
    return jsonSuccess({
      id: updated.id,
      totalAmount: updated.totalAmount,
      previousTotal: pool.totalAmount,
      addAmount,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
