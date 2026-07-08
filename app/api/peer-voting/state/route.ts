import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { getParticipantVotingState } from "@/lib/peer-voting/service";

/** Drives the /vote ballot and the dashboard entry card. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const state = await getParticipantVotingState(user);
    return jsonSuccess(state);
  } catch (error) {
    return toErrorResponse(error);
  }
}
