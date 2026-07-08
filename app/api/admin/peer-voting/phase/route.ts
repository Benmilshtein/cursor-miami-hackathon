import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { isValidPeerVotingPhase } from "@/lib/peer-voting/phase";
import {
  getAdminPeerVotingOverview,
  transitionPeerVotingPhase,
} from "@/lib/peer-voting/service";

/** Current phase plus group counts and vote totals for the admin panel. */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const overview = await getAdminPeerVotingOverview();
    return jsonSuccess(overview);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Advance the expo phase (forward-only: closed → round_1 → round_2 → finished). */
export async function PATCH(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const body = await parseJsonBody<{ phase: string }>(request);

    if (!body.phase || !isValidPeerVotingPhase(body.phase)) {
      throw new AppError(
        400,
        "INVALID_PHASE",
        "Phase must be one of: closed, round_1, round_2, finished.",
      );
    }

    const phase = await transitionPeerVotingPhase(body.phase);
    return jsonSuccess({ phase });
  } catch (error) {
    return toErrorResponse(error);
  }
}
