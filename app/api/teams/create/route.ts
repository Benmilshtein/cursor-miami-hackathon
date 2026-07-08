import type { NextRequest } from "next/server";
import { jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { createTeam } from "@/lib/teams/service";
import { parseCreateTeamInput } from "@/lib/teams/validation";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const result = await createTeam(actor, parseCreateTeamInput(body));

    return jsonSuccess(result, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
