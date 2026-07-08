import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { requireParticipantScreeningOpen } from "@/lib/screening-phase";
import { listQuestionsForParticipant } from "@/lib/screening/service";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser(request);
    await requireParticipantScreeningOpen();
    const questions = await listQuestionsForParticipant();
    return jsonSuccess({ questions });
  } catch (error) {
    return toErrorResponse(error);
  }
}
