import { requireSessionUser } from "@/lib/auth/session";
import { AppError, toErrorResponse, jsonSuccess } from "@/lib/api/http";
import { acceptMentorRequest } from "@/lib/mentor/service";

type Params = { params: Promise<{ requestId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const actor = await requireSessionUser(request);
    if (actor.role !== "mentor") {
      throw new AppError(403, "FORBIDDEN", "Mentor access required.");
    }
    const { requestId } = await params;
    await acceptMentorRequest(requestId, actor.id);
    return jsonSuccess({ accepted: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
