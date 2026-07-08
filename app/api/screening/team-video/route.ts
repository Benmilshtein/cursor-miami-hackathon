import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { requireParticipantScreeningOpen } from "@/lib/screening-phase";
import { resolveActiveMembershipForUser, setTeamVideo } from "@/lib/screening/service";

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    await requireParticipantScreeningOpen();
    const membership = await resolveActiveMembershipForUser(actor.id);
    if (!membership) {
      throw new AppError(400, "NO_TEAM", "You must be in a team to set the demo video.");
    }
    if (membership.role !== "lead") {
      throw new AppError(403, "FORBIDDEN", "Only the team lead can update team demo video.");
    }
    const body = await parseJsonBody<{ videoUrl?: string | null }>(request);
    await setTeamVideo(actor, membership.teamId, {
      videoUrl: body.videoUrl,
    });
    return jsonSuccess({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
