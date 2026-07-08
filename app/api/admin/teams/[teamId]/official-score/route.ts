import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { updateTeamRankingPresentation } from "@/lib/scoring/service";

type Ctx = { params: Promise<{ teamId: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    await requireSuperAdminUser(request);
    const { teamId: raw } = await ctx.params;
    const teamId = parseInt(raw, 10);
    if (Number.isNaN(teamId)) {
      throw new AppError(400, "INVALID_TEAM", "Invalid team id.");
    }

    const body = await parseJsonBody<{ finalScore?: unknown; latePenalty?: unknown }>(request);

    let finalScore: number | null;
    const v = body.finalScore;
    if (v === null || v === undefined || v === "") {
      finalScore = null;
    } else if (typeof v === "number" && Number.isFinite(v)) {
      finalScore = v;
    } else if (typeof v === "string" && v.trim() !== "") {
      const n = parseFloat(v);
      finalScore = Number.isNaN(n) ? null : n;
    } else {
      throw new AppError(400, "INVALID_BODY", "finalScore must be a number, null, or empty.");
    }

    const lp = body.latePenalty;
    let lateSubmissionPenaltyPoints: number;
    if (typeof lp === "number" && Number.isFinite(lp)) {
      lateSubmissionPenaltyPoints = Math.trunc(lp);
    } else if (typeof lp === "string" && lp.trim() !== "") {
      const n = parseInt(lp, 10);
      lateSubmissionPenaltyPoints = Number.isNaN(n) ? 0 : n;
    } else {
      throw new AppError(400, "INVALID_BODY", "latePenalty (number) is required.");
    }

    await updateTeamRankingPresentation(teamId, {
      finalScoreOverride: finalScore,
      lateSubmissionPenaltyPoints,
    });

    return jsonSuccess({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
