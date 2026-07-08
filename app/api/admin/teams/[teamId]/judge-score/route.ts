import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { upsertJudgeScoreByAdmin, type ScoreCriteria } from "@/lib/scoring/service";

type Ctx = { params: Promise<{ teamId: string }> };

function readInt(body: Record<string, unknown>, key: string): number | undefined {
  const v = body[key];
  if (v === undefined) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
  }
  return undefined;
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    await requireSuperAdminUser(request);
    const { teamId: raw } = await ctx.params;
    const teamId = parseInt(raw, 10);
    if (Number.isNaN(teamId)) {
      throw new AppError(400, "INVALID_TEAM", "Invalid team id.");
    }

    const body = await parseJsonBody<Record<string, unknown>>(request);
    const judgeUserId = typeof body.judgeUserId === "string" ? body.judgeUserId.trim() : "";
    if (!judgeUserId) {
      throw new AppError(400, "INVALID_BODY", "judgeUserId is required.");
    }

    const innovation = readInt(body, "innovation");
    const technicalExecution = readInt(body, "technicalExecution");
    const aiUsage = readInt(body, "aiUsage");
    const uxUi = readInt(body, "uxUi");
    const businessPotential = readInt(body, "businessPotential");

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
      innovation,
      technicalExecution,
      aiUsage,
      uxUi,
      businessPotential,
    };

    let comment: string | null = null;
    if ("comment" in body) {
      if (body.comment === null) comment = null;
      else if (typeof body.comment === "string") comment = body.comment;
      else throw new AppError(400, "INVALID_BODY", "comment must be a string or null.");
    }

    const saved = await upsertJudgeScoreByAdmin(teamId, judgeUserId, scores, comment);
    return jsonSuccess({ score: saved });
  } catch (error) {
    return toErrorResponse(error);
  }
}
