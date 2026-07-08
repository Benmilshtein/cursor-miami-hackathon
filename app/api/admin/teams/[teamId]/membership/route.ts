import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { forceUpdateTeamMembership } from "@/lib/teams/service";
import { parseAdminForceMembershipInput } from "@/lib/teams/validation";

function parseTeamId(rawTeamId: string) {
  const teamId = Number(rawTeamId);

  if (!Number.isInteger(teamId) || teamId <= 0) {
    throw new AppError(400, "INVALID_TEAM_ID", "teamId must be a positive integer.");
  }

  return teamId;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> },
) {
  try {
    const actor = await requireSuperAdminUser(request);
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const { teamId } = await context.params;
    const result = await forceUpdateTeamMembership(
      actor,
      parseTeamId(teamId),
      parseAdminForceMembershipInput(body),
    );

    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
