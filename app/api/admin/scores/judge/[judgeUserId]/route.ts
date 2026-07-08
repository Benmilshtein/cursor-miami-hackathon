import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { deleteScoresByJudge } from "@/lib/scoring/service";
import { notifyRankingUpdate } from "@/lib/scoring/events";

type Ctx = { params: Promise<{ judgeUserId: string }> };

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    await requireSuperAdminUser(request);
    const { judgeUserId } = await ctx.params;
    if (!judgeUserId?.trim()) {
      throw new AppError(400, "INVALID_INPUT", "Judge user ID is required.");
    }
    const deleted = await deleteScoresByJudge(judgeUserId);
    notifyRankingUpdate();
    return jsonSuccess({ deleted });
  } catch (error) {
    return toErrorResponse(error);
  }
}
