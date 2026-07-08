import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { updateJudgeScoreByAdmin, type ScoreCriteria } from "@/lib/scoring/service";

type Ctx = { params: Promise<{ scoreId: string }> };

function readNumber(body: Record<string, unknown>, key: string): number | undefined {
  const v = body[key];
  if (v === undefined) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    await requireSuperAdminUser(request);
    const { scoreId } = await ctx.params;
    if (!scoreId?.trim()) {
      throw new AppError(400, "INVALID_INPUT", "Score id is required.");
    }

    const body = await parseJsonBody<Record<string, unknown>>(request);

    const innovation = readNumber(body, "innovation");
    const technicalExecution = readNumber(body, "technicalExecution");
    const aiUsage = readNumber(body, "aiUsage");
    const uxUi = readNumber(body, "uxUi");
    const businessPotential = readNumber(body, "businessPotential");

    if (
      innovation === undefined ||
      technicalExecution === undefined ||
      aiUsage === undefined ||
      uxUi === undefined ||
      businessPotential === undefined
    ) {
      throw new AppError(
        400,
        "INVALID_BODY",
        "All criteria are required: innovation, technicalExecution, aiUsage, uxUi, businessPotential.",
      );
    }

    const scores: ScoreCriteria = {
      innovation: Math.trunc(innovation),
      technicalExecution: Math.trunc(technicalExecution),
      aiUsage: Math.trunc(aiUsage),
      uxUi: Math.trunc(uxUi),
      businessPotential: Math.trunc(businessPotential),
    };

    let comment: string | null | undefined;
    if ("comment" in body) {
      if (body.comment === null) comment = null;
      else if (typeof body.comment === "string") comment = body.comment;
      else throw new AppError(400, "INVALID_BODY", "comment must be a string or null.");
    }

    const updated = await updateJudgeScoreByAdmin(scoreId, scores, comment);

    return jsonSuccess({ score: updated });
  } catch (error) {
    return toErrorResponse(error);
  }
}
