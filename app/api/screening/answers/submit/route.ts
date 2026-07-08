import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { requireParticipantScreeningOpen } from "@/lib/screening-phase";
import { upsertAnswer } from "@/lib/screening/service";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    await requireParticipantScreeningOpen();
    const body = await parseJsonBody<{ questionId: number; selectedIndex: number }>(request);
    const questionId = typeof body.questionId === "number" ? body.questionId : NaN;
    const selectedIndex = typeof body.selectedIndex === "number" ? body.selectedIndex : NaN;
    if (!Number.isInteger(questionId) || questionId < 1) {
      throw new AppError(400, "INVALID_INPUT", "questionId must be a positive integer.");
    }
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0) {
      throw new AppError(400, "INVALID_INPUT", "selectedIndex must be a non-negative integer.");
    }
    const result = await upsertAnswer(actor.id, questionId, selectedIndex);
    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
