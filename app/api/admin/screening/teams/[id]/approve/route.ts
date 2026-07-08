import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { team } from "@/db/schema/auth";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) throw new AppError(400, "INVALID_ID", "Invalid team id.");
  return n;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireSuperAdminUser(request);
    const teamId = parseId((await params).id);
    const [t] = await db.select().from(team).where(eq(team.id, teamId)).limit(1);
    if (!t) throw new AppError(404, "NOT_FOUND", "Team not found.");
    await db
      .update(team)
      .set({
        screeningStatus: "approved",
        screeningApprovedAt: new Date(),
        screeningApprovedByUserId: actor.id,
        screeningRejectedAt: null,
        screeningRejectedReason: null,
        updatedAt: new Date(),
      })
      .where(eq(team.id, teamId));
    return jsonSuccess({ ok: true, screeningStatus: "approved" });
  } catch (error) {
    return toErrorResponse(error);
  }
}
