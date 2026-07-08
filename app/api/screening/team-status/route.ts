import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { requireParticipantScreeningOpen } from "@/lib/screening-phase";
import {
  getTeamScreeningStatus,
  canTeamSubmit,
  getTeamMembersWithAnswers,
  resolveActiveMembershipForUser,
} from "@/lib/screening/service";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    await requireParticipantScreeningOpen();
    const membership = await resolveActiveMembershipForUser(actor.id);
    if (!membership) {
      return jsonSuccess({
        teamId: null,
        status: null,
        videoUrl: null,
        videoStorageUrl: null,
        canSubmit: false,
        hasVideo: false,
        allMembersCompletedLogic: false,
        memberCount: 0,
        requiredAnswerCount: 0,
        canManageTeamVideo: false,
        submittedAt: null,
        rejectedAt: null,
        rejectedReason: null,
      });
    }
    const teamId = membership.teamId;
    const status = await getTeamScreeningStatus(teamId);
    const can = await canTeamSubmit(teamId);
    const { answerCountByUser } = await getTeamMembersWithAnswers(teamId);
    return jsonSuccess({
      teamId,
      status: status?.screeningStatus ?? "draft",
      videoUrl: status?.screeningVideoUrl ?? null,
      videoStorageUrl: status?.screeningVideoStoragePath ?? null,
      canSubmit: can.canSubmit,
      hasVideo: can.hasVideo,
      allMembersCompletedLogic: can.allMembersCompletedLogic,
      memberCount: can.memberCount,
      requiredAnswerCount: can.requiredAnswerCount,
      canManageTeamVideo: membership.role === "lead",
      submittedAt: status?.screeningSubmittedAt ?? null,
      rejectedAt: status?.screeningRejectedAt ?? null,
      rejectedReason: status?.screeningRejectedReason ?? null,
      answerCountByUser: Object.fromEntries(answerCountByUser),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
