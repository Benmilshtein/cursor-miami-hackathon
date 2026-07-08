import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { requireParticipantScreeningOpen } from "@/lib/screening-phase";
import { resolveActiveTeamIdForUser, submitTeamForReview } from "@/lib/screening/service";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    await requireParticipantScreeningOpen();
    const teamId = await resolveActiveTeamIdForUser(actor.id);
    if (!teamId) {
      throw new AppError(400, "NO_TEAM", "You must be in a team to submit for review.");
    }
    await submitTeamForReview(actor, teamId);
    return jsonSuccess({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
