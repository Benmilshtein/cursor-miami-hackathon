import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { requireParticipantScreeningOpen } from "@/lib/screening-phase";
import { getMyAnswers } from "@/lib/screening/service";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    await requireParticipantScreeningOpen();
    const answers = await getMyAnswers(actor.id);
    return jsonSuccess({ answers });
  } catch (error) {
    return toErrorResponse(error);
  }
}
