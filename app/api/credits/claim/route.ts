import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { claimParticipantAllocation } from "@/lib/credits/redeem";

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const body = await parseJsonBody<{ allocationId?: number }>(request);
    const allocationId = typeof body.allocationId === "number" ? body.allocationId : NaN;
    if (!Number.isInteger(allocationId) || allocationId < 1) {
      throw new AppError(400, "INVALID_INPUT", "allocationId must be a positive integer.");
    }
    const result = await claimParticipantAllocation(user.id, allocationId);
    return jsonSuccess(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
