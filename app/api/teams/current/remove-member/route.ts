import type { NextRequest } from "next/server";
import { jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { removeMemberFromCurrentTeam } from "@/lib/teams/service";
import { parseRemoveMemberInput } from "@/lib/teams/validation";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const { memberUserId } = parseRemoveMemberInput(body);
    const result = await removeMemberFromCurrentTeam(actor, memberUserId);

    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
