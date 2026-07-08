import type { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { creditAuditLog, creditPool } from "@/db/schema/partners";
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

/** GET: audit entries for this pool (newest first). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireSuperAdminUser(request);
    const poolId = parsePoolId((await params).id);

    const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
    if (!pool) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");

    const rows = await db
      .select({
        id: creditAuditLog.id,
        actorUserId: creditAuditLog.actorUserId,
        action: creditAuditLog.action,
        details: creditAuditLog.details,
        createdAt: creditAuditLog.createdAt,
      })
      .from(creditAuditLog)
      .where(eq(creditAuditLog.creditPoolId, poolId))
      .orderBy(desc(creditAuditLog.createdAt))
      .limit(100);

    return jsonSuccess({
      entries: rows.map((r) => ({
        ...r,
        details: r.details
          ? (() => {
              try {
                return JSON.parse(r.details as string) as unknown;
              } catch {
                return r.details;
              }
            })()
          : null,
      })),
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
