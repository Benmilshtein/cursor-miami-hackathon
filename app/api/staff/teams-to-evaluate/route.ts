import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import {
  getApprovedTeamsForJudge,
  getApprovedTeamsForMentor,
} from "@/lib/scoring/service";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    if (actor.role === "judge") {
      const teams = await getApprovedTeamsForJudge(actor.id);
      return jsonSuccess(teams);
    }
    if (actor.role === "mentor") {
      const teams = await getApprovedTeamsForMentor();
      return jsonSuccess(teams);
    }
    throw new AppError(403, "FORBIDDEN", "Only judges and mentors can access this endpoint.");
  } catch (error) {
    return toErrorResponse(error);
  }
}
