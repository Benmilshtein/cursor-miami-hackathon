import type { NextRequest } from "next/server";
import { jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { getCurrentUserTeam, updateCurrentTeam } from "@/lib/teams/service";
import { parseUpdateTeamInput } from "@/lib/teams/validation";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const result = await getCurrentUserTeam(actor);

    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const result = await updateCurrentTeam(actor, parseUpdateTeamInput(body));

    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
