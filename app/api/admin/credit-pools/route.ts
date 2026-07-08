import type { NextRequest } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { creditPool, partner } from "@/db/schema/partners";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { getAllocatedTotalForPool } from "@/lib/credits/distribution";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInt(value: string | null, fallback: number, field: string) {
  if (value === null) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw new AppError(400, "INVALID_QUERY", `${field} must be a non-negative integer.`);
  }
  return n;
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT, "limit"),
      MAX_LIMIT
    );
    const offset = parsePositiveInt(searchParams.get("offset"), 0, "offset");
    const partnerIdParam = searchParams.get("partnerId")?.trim();
    const partnerId = partnerIdParam ? parseInt(partnerIdParam, 10) : undefined;
    if (partnerIdParam && (partnerId === undefined || Number.isNaN(partnerId) || partnerId < 1)) {
      throw new AppError(400, "INVALID_QUERY", "partnerId must be a positive integer.");
    }

    const pools = await db
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
      .where(partnerId ? eq(creditPool.partnerId, partnerId) : undefined)
      .orderBy(desc(creditPool.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(creditPool)
      .where(partnerId ? eq(creditPool.partnerId, partnerId) : undefined);
    const total = totalResult[0]?.count ?? 0;

    const withAllocated = await Promise.all(
      pools.map(async (p) => {
        const allocated = await getAllocatedTotalForPool(p.id);
        return {
          ...p,
          allocatedTotal: allocated ?? "0",
          remainder: String(Math.max(0, Number(p.totalAmount) - Number(allocated ?? 0))),
        };
      })
    );

    return jsonSuccess({
      pools: withAllocated,
      total,
      limit,
      offset,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

const DISTRIBUTION_TYPES = ["even", "excel_unique", "general_link"] as const;

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSuperAdminUser(request);
    const body = await parseJsonBody<{
      partnerId: number;
      totalAmount: number;
      targetType: "team" | "participant";
      distributionType?: (typeof DISTRIBUTION_TYPES)[number];
      generalCreditUrl?: string | null;
    }>(request);
    const partnerId = typeof body.partnerId === "number" ? body.partnerId : NaN;
    if (!Number.isInteger(partnerId) || partnerId < 1) {
      throw new AppError(400, "INVALID_INPUT", "partnerId must be a positive integer.");
    }
    const totalAmount = typeof body.totalAmount === "number" ? body.totalAmount : NaN;
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      throw new AppError(400, "INVALID_INPUT", "totalAmount must be a non-negative number.");
    }
    const targetType = body.targetType === "team" || body.targetType === "participant" ? body.targetType : undefined;
    if (!targetType) {
      throw new AppError(400, "INVALID_INPUT", "targetType must be 'team' or 'participant'.");
    }

    const distributionType =
      body.distributionType && DISTRIBUTION_TYPES.includes(body.distributionType)
        ? body.distributionType
        : "even";

    if (
      (distributionType === "excel_unique" || distributionType === "general_link") &&
      targetType !== "participant"
    ) {
      throw new AppError(
        400,
        "INVALID_INPUT",
        "Excel and general-link modes require participant target.",
      );
    }

    let generalCreditUrl: string | null = null;
    if (distributionType === "general_link") {
      const raw = typeof body.generalCreditUrl === "string" ? body.generalCreditUrl.trim() : "";
      if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
        throw new AppError(
          400,
          "INVALID_INPUT",
          "generalCreditUrl must be an http(s) URL for general link pools.",
        );
      }
      generalCreditUrl = raw;
    }

    const [created] = await db
      .insert(creditPool)
      .values({
        partnerId,
        totalAmount: String(totalAmount),
        targetType,
        distributionType,
        generalCreditUrl,
        createdByUserId: actor.id,
      })
      .returning();
    if (!created) throw new AppError(500, "CREATE_FAILED", "Failed to create credit pool.");
    const [partnerRow] = await db.select({ name: partner.name }).from(partner).where(eq(partner.id, created.partnerId)).limit(1);
    return jsonSuccess(
      {
        id: created.id,
        partnerId: created.partnerId,
        partnerName: partnerRow?.name ?? null,
        totalAmount: created.totalAmount,
        targetType: created.targetType,
        distributionType: created.distributionType,
        generalCreditUrl: created.generalCreditUrl,
        createdAt: created.createdAt,
        createdByUserId: created.createdByUserId,
      },
      201
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
