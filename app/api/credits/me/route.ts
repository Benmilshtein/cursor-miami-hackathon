import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { getParticipantCreditsForUser } from "@/lib/credits/participant-credits";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const credits = await getParticipantCreditsForUser(user.id);
    return jsonSuccess({ credits });
  } catch (e) {
    return toErrorResponse(e);
  }
}
