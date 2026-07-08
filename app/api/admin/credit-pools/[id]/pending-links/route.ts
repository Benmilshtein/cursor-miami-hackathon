import type { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { creditPendingLink, creditPool } from "@/db/schema/partners";
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

/** GET: pending staged links (undistributed). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireSuperAdminUser(request);
    const poolId = parsePoolId((await params).id);

    const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
    if (!pool) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");

    const rows = await db
      .select({
        id: creditPendingLink.id,
        targetUserId: creditPendingLink.targetUserId,
        fullUrl: creditPendingLink.fullUrl,
        status: creditPendingLink.status,
        uploadBatchId: creditPendingLink.uploadBatchId,
        createdAt: creditPendingLink.createdAt,
      })
      .from(creditPendingLink)
      .where(
        and(eq(creditPendingLink.creditPoolId, poolId), eq(creditPendingLink.status, "pending")),
      )
      .orderBy(desc(creditPendingLink.createdAt));

    return jsonSuccess({
      pending: rows,
      pendingCount: rows.length,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
