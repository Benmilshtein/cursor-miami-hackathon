import type { NextRequest } from "next/server";
import { db } from "@/db";
import { creditPool } from "@/db/schema/partners";
import { eq } from "drizzle-orm";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import {
  getDistributionPreview,
  runDistribution,
} from "@/lib/credits/distribution";

type Params = { params: Promise<{ id: string }> };

function parsePoolId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) {
    throw new AppError(400, "INVALID_ID", "Invalid pool id.");
  }
  return n;
}

/** GET: preview distribution (remainder, recipient count, amount per recipient). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireSuperAdminUser(request);
    const poolId = parsePoolId((await params).id);
    const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
    if (!pool) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");
    const preview = await getDistributionPreview(poolId);
    if (!preview) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");
    return jsonSuccess(preview);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** POST: run distribution and generate redemption links. */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireSuperAdminUser(request);
    const poolId = parsePoolId((await params).id);
    const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
    if (!pool) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");
    const result = await runDistribution(poolId, actor.id);
    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
