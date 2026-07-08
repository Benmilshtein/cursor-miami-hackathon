import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { getAllTeamsWithRequestStatus } from "@/lib/mentor/service";

export async function GET(request: Request) {
  try {
    const actor = await requireSessionUser(request);
    if (actor.role !== "mentor") {
      throw new AppError(403, "FORBIDDEN", "Mentor access required.");
    }
    const teams = await getAllTeamsWithRequestStatus();
    return jsonSuccess(teams);
  } catch (e) {
    return toErrorResponse(e);
  }
}
