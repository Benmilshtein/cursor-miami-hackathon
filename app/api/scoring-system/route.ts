import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { getMiamiScoringBoard } from "@/lib/scoring/miami";

/**
 * GET: the Miami Scoring System board - teams with members, links, PRD flag,
 * disqualification state, and scores per the visibility rules (judges see a
 * team's scores only after submitting their own; admins see everything).
 * Judges and super admins only; never exposed to participants.
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    if (actor.role !== "judge" && actor.role !== "super_admin") {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Only judges and super admins can access the Miami Scoring System.",
      );
    }
    const board = await getMiamiScoringBoard(actor);
    return jsonSuccess({ role: actor.role, ...board });
  } catch (error) {
    return toErrorResponse(error);
  }
}
