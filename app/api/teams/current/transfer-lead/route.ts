import type { NextRequest } from "next/server";
import { jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { transferCurrentTeamLead } from "@/lib/teams/service";
import { parseTransferLeadInput } from "@/lib/teams/validation";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const { newLeadUserId } = parseTransferLeadInput(body);
    const result = await transferCurrentTeamLead(actor, newLeadUserId);

    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
