import { requireSessionUser } from "@/lib/auth/session";
import { AppError, toErrorResponse, jsonSuccess } from "@/lib/api/http";
import { getActiveRequestForMentor } from "@/lib/mentor/service";

export async function GET(request: Request) {
  try {
    const actor = await requireSessionUser(request);
    if (actor.role !== "mentor") {
      throw new AppError(403, "FORBIDDEN", "Mentor access required.");
    }
    const req = await getActiveRequestForMentor(actor.id);
    return jsonSuccess({ request: req });
  } catch (e) {
    return toErrorResponse(e);
  }
}
