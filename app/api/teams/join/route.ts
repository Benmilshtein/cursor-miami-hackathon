import type { NextRequest } from "next/server";
import { jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { joinTeamByCode } from "@/lib/teams/service";
import { parseJoinTeamInput } from "@/lib/teams/validation";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const result = await joinTeamByCode(actor, parseJoinTeamInput(body));

    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
