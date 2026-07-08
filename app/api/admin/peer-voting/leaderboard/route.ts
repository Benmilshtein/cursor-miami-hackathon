import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { getCrowdLeaderboard } from "@/lib/peer-voting/service";

/** Crowd leaderboard ranked by credits → unique voters → earliest submission. */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const leaderboard = await getCrowdLeaderboard();
    return jsonSuccess({ leaderboard });
  } catch (error) {
    return toErrorResponse(error);
  }
}
