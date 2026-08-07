import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { setTeamDisqualification } from "@/lib/scoring/miami";

/**
 * POST: disqualify a team (reason note required) or reinstate it.
 * Super admin only. Visible to judges and super admins, never to teams.
 * Deliberately fires no notifications or events.
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await requireSuperAdminUser(request);
    const body = await parseJsonBody<Record<string, unknown>>(request);

    const teamId = Number(body.teamId);
    if (!Number.isInteger(teamId) || teamId < 1) {
      throw new AppError(400, "INVALID_TEAM", "Invalid team id.");
    }
    const disqualified = body.disqualified === true;
    const reason = typeof body.reason === "string" ? body.reason : undefined;

    const result = await setTeamDisqualification(actor.id, teamId, disqualified, reason);
    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
