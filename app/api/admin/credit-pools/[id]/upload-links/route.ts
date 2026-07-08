import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { creditPendingLink, creditPool, creditUploadBatch } from "@/db/schema/partners";
import { user } from "@/db/schema/auth";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { parseCreditLinkRows } from "@/lib/credits/parse-excel-links";
import { logCreditAudit } from "@/lib/credits/audit";

type Params = { params: Promise<{ id: string }> };

function parsePoolId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) {
    throw new AppError(400, "INVALID_ID", "Invalid pool id.");
  }
  return n;
}

/**
 * POST: parse a credit-link file (CSV or XLSX), dedupe URLs, and stage them as
 * pending links. Rows with a valid user_id are pre-assigned to that user; all
 * other URLs are staged untargeted (available to assign to any recipient at
 * distribute time). The admin runs distribute separately.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireSuperAdminUser(request);
    const poolId = parsePoolId((await params).id);

    const [pool] = await db
      .select()
      .from(creditPool)
      .where(eq(creditPool.id, poolId))
      .limit(1);
    if (!pool) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");
    if (pool.distributionType !== "excel_unique") {
      throw new AppError(
        400,
        "POOL_MODE",
        "Link upload is only for pools with distribution type “Unique links (Excel)”.",
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      throw new AppError(400, "MISSING_FILE", "Upload a CSV or Excel file (field: file).");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const { rows, rawRowCount, dedupedRowCount } = parseCreditLinkRows(buffer);
    if (rows.length === 0) {
      throw new AppError(
        400,
        "NO_LINKS",
        "No valid URLs found. Provide a column of credit links (header url/link optional). URLs must start with http:// or https://.",
      );
    }

    // Resolve any provided user ids so matching rows can be pre-targeted.
    const providedUserIds = [
      ...new Set(rows.map((r) => r.userId).filter((v): v is string => !!v)),
    ];
    const existingUsers = providedUserIds.length
      ? await db
          .select({ id: user.id })
          .from(user)
          .where(inArray(user.id, providedUserIds))
      : [];
    const existingSet = new Set(existingUsers.map((u) => u.id));

    const batchId = randomUUID();
    let stagedRows = 0;

    await db.transaction(async (tx) => {
      // Dedupe new URLs against URLs already staged as pending for this pool.
      const alreadyPending = await tx
        .select({ fullUrl: creditPendingLink.fullUrl })
        .from(creditPendingLink)
        .where(
          and(
            eq(creditPendingLink.creditPoolId, poolId),
            eq(creditPendingLink.status, "pending"),
          ),
        );
      const pendingUrls = new Set(alreadyPending.map((p) => p.fullUrl.toLowerCase()));

      await tx.insert(creditUploadBatch).values({
        id: batchId,
        creditPoolId: poolId,
        uploadedByUserId: actor.id,
        fileName: file.name || null,
        rawRowCount,
        dedupedRowCount,
      });

      const pendingValues = rows
        .filter((r) => !pendingUrls.has(r.url.toLowerCase()))
        .map((r) => ({
          creditPoolId: poolId,
          uploadBatchId: batchId,
          targetUserId: r.userId && existingSet.has(r.userId) ? r.userId : null,
          fullUrl: r.url,
          status: "pending" as const,
        }));

      if (pendingValues.length === 0) {
        throw new AppError(
          400,
          "NO_NEW_LINKS",
          "All URLs in this file are already staged for this pool.",
        );
      }

      await tx.insert(creditPendingLink).values(pendingValues);
      stagedRows = pendingValues.length;

      const newTotal = Number(pool.totalAmount) + pendingValues.length;
      await tx
        .update(creditPool)
        .set({ totalAmount: String(newTotal), updatedAt: new Date() })
        .where(eq(creditPool.id, poolId));
    });

    await logCreditAudit(poolId, actor.id, "excel_upload", {
      batchId,
      fileName: file.name,
      rawRowCount,
      dedupedRowCount,
      stagedRows,
    });

    const [{ count: pendingCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(creditPendingLink)
      .where(
        and(
          eq(creditPendingLink.creditPoolId, poolId),
          eq(creditPendingLink.status, "pending"),
        ),
      );

    return jsonSuccess({
      batchId,
      rawRowCount,
      dedupedRowCount,
      stagedRows,
      pendingLinkCount: pendingCount ?? 0,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
