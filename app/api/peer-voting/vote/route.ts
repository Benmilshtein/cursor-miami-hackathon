import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { deletePeerVote, upsertPeerVote } from "@/lib/peer-voting/service";

function parseTeamId(value: unknown): number {
  const teamId = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(teamId) || teamId <= 0) {
    throw new AppError(400, "INVALID_TEAM_ID", "teamId must be a positive integer.");
  }
  return teamId;
}

/** Allocate 1–3 credits to a team in the other group. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const body = await parseJsonBody<{ teamId?: unknown; credits?: unknown }>(request);
    const teamId = parseTeamId(body.teamId);
    const credits = typeof body.credits === "number" ? body.credits : Number(body.credits);
    const saved = await upsertPeerVote(user.id, teamId, credits);
    return jsonSuccess(saved);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Un-allocate a voter's credits for a team, freeing them up. */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const body = await parseJsonBody<{ teamId?: unknown }>(request);
    const teamId = parseTeamId(body.teamId);
    const result = await deletePeerVote(user.id, teamId);
    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
