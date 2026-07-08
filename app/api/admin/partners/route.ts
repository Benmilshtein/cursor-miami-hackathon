import type { NextRequest } from "next/server";
import { db } from "@/db";
import { partner } from "@/db/schema/partners";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const list = await db
      .select({
        id: partner.id,
        name: partner.name,
        redeemBaseUrl: partner.redeemBaseUrl,
        createdAt: partner.createdAt,
      })
      .from(partner)
      .orderBy(asc(partner.name));
    return jsonSuccess({ partners: list });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const body = await parseJsonBody<{ name: string; redeemBaseUrl?: string }>(request);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      throw new AppError(400, "INVALID_INPUT", "name is required.");
    }
    const redeemBaseUrl =
      body.redeemBaseUrl === undefined || body.redeemBaseUrl === null
        ? null
        : typeof body.redeemBaseUrl === "string"
          ? body.redeemBaseUrl.trim() || null
          : null;
    const [created] = await db
      .insert(partner)
      .values({ name, redeemBaseUrl })
      .returning({ id: partner.id, name: partner.name, redeemBaseUrl: partner.redeemBaseUrl, createdAt: partner.createdAt });
    return jsonSuccess(created!, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
