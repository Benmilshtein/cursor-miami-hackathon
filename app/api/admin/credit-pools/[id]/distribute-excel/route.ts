import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { creditPool } from "@/db/schema/partners";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import {
  runUniqueDistribution,
  type UniqueDistributionScope,
} from "@/lib/credits/distribution";
import { logCreditAudit } from "@/lib/credits/audit";

type Params = { params: Promise<{ id: string }> };

function parsePoolId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) {
    throw new AppError(400, "INVALID_ID", "Invalid pool id.");
  }
  return n;
}

function parseScope(body: unknown): UniqueDistributionScope {
  const b = (body ?? {}) as Record<string, unknown>;
  if (b.scope === "teams") {
    const teamIds = Array.isArray(b.teamIds)
      ? b.teamIds.map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0)
      : [];
    if (teamIds.length === 0) {
      throw new AppError(400, "NO_TEAMS", "Select at least one team to disburse to.");
    }
    return { kind: "teams", teamIds };
  }
  if (b.scope === "participants") {
    const userIds = Array.isArray(b.userIds)
      ? b.userIds.map((v) => String(v)).filter((s) => s.trim().length > 0)
      : [];
    if (userIds.length === 0) {
      throw new AppError(400, "NO_PARTICIPANTS", "Select at least one participant to disburse to.");
    }
    return { kind: "participants", userIds };
  }
  throw new AppError(400, "INVALID_SCOPE", "Choose teams or participants to disburse to.");
}

/** POST: assign staged unique URLs to selected teams' members or selected participants. */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireSuperAdminUser(request);
    const poolId = parsePoolId((await params).id);

    const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
    if (!pool) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");
    if (pool.distributionType !== "excel_unique") {
      throw new AppError(400, "POOL_MODE", "This action is only for Unique links (Excel) pools.");
    }

    const body = await request.json().catch(() => ({}));
    const scope = parseScope(body);

    const result = await runUniqueDistribution(poolId, actor.id, scope);
    await logCreditAudit(poolId, actor.id, "distribute_excel", {
      scope: scope.kind,
      ...(scope.kind === "teams" ? { teamIds: scope.teamIds } : { userCount: scope.userIds.length }),
      ...result,
    });

    return jsonSuccess(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
