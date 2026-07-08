import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { updateTeamScoringAdjustments } from "@/lib/scoring/service";

type Ctx = { params: Promise<{ teamId: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    await requireSuperAdminUser(request);
    const { teamId: raw } = await ctx.params;
    const teamId = parseInt(raw, 10);
    if (Number.isNaN(teamId)) {
      throw new AppError(400, "INVALID_TEAM", "Invalid team id.");
    }

    const body = await parseJsonBody<{
      judgeCountOverride?: unknown;
      lateSubmissionPenaltyPoints?: unknown;
      finalScoreOverride?: unknown;
    }>(request);

    if (typeof body.lateSubmissionPenaltyPoints !== "number" || Number.isNaN(body.lateSubmissionPenaltyPoints)) {
      throw new AppError(400, "INVALID_BODY", "lateSubmissionPenaltyPoints (number) is required.");
    }

    let judgeCountOverride: number | null;
    const rawOverride = body.judgeCountOverride;
    if (rawOverride === null || rawOverride === undefined || rawOverride === "") {
      judgeCountOverride = null;
    } else if (typeof rawOverride === "number" && Number.isFinite(rawOverride)) {
      judgeCountOverride = Math.trunc(rawOverride);
    } else if (typeof rawOverride === "string" && rawOverride.trim() !== "") {
      const n = parseInt(rawOverride, 10);
      judgeCountOverride = Number.isNaN(n) ? null : n;
    } else {
      throw new AppError(400, "INVALID_BODY", "judgeCountOverride must be a number, null, or omitted.");
    }

    let finalScoreOverride: number | null;
    const rawFinal = body.finalScoreOverride;
    if (rawFinal === null || rawFinal === undefined || rawFinal === "") {
      finalScoreOverride = null;
    } else if (typeof rawFinal === "number" && Number.isFinite(rawFinal)) {
      finalScoreOverride = rawFinal;
    } else if (typeof rawFinal === "string" && rawFinal.trim() !== "") {
      const n = parseFloat(rawFinal);
      finalScoreOverride = Number.isNaN(n) ? null : n;
    } else {
      throw new AppError(400, "INVALID_BODY", "finalScoreOverride must be a number, null, or empty.");
    }

    await updateTeamScoringAdjustments(teamId, {
      judgeCountOverride,
      lateSubmissionPenaltyPoints: body.lateSubmissionPenaltyPoints,
      finalScoreOverride,
    });

    return jsonSuccess({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
