import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { parseMiamiPillars, submitMiamiScore } from "@/lib/scoring/miami";

/**
 * POST: submit the three Miami pillars (0-10 each) for one team.
 * Judges only; one submission per team, immutable afterwards.
 * Deliberately fires no notifications or events.
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    if (actor.role !== "judge") {
      throw new AppError(403, "FORBIDDEN", "Only judges can submit scores.");
    }

    const body = await parseJsonBody<Record<string, unknown>>(request);
    const teamId = Number(body.teamId);
    if (!Number.isInteger(teamId) || teamId < 1) {
      throw new AppError(400, "INVALID_TEAM", "Invalid team id.");
    }
    const pillars = parseMiamiPillars(body);

    const score = await submitMiamiScore(actor.id, teamId, pillars);
    return jsonSuccess(score, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
